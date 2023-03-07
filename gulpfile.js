const pkg = require('./package.json');
const typescript = require('rollup-plugin-typescript2');
const path = require('path');
const fs = require('fs');
// npm install del@3.0.0 --save-dev  
const del = require("del");
// npm install gulp --save-dev
const gulp = require('gulp');
const rollup = require('rollup');
// npm install rollup-plugin-node-resolve --save-dev
const resolve = require('rollup-plugin-node-resolve');
// npm install rollup-plugin-commonjs --save-dev
const commonjs = require('rollup-plugin-commonjs');
// npm install rollup-plugin-cleanup --save-dev
const cleanup = require('rollup-plugin-cleanup');
const child_process = require("child_process");
// npm install gulp-uglify-es --save-dev
const uglify = require('gulp-uglify-es').default;
// npm install remove-internal --save-dev
// const internal = require('remove-internal');
const ts = require("typescript");
// npm install gulp-rename --save-dev
const rename = require('gulp-rename');
// npm install --save-dev gulp-strip-comments
const strip = require('gulp-strip-comments');

const workSpaceDir = '.'

function clear(done) {
    const delList = ['./build/**'];
    del(delList, { force: true }).then(paths => {
        done();
    }).catch((err) => {
        throw err;
    })
}

const tsCongfig = ["./tsconfig.cjs.json", "./tsconfig.es.json"]
function tsc(done) {
    let mark = 0;
    let _result = 0;
    const start = function (result) {
        mark--;
        _result += result;
        if (!mark) {
            if (!_result) {
                //进程全部执行完毕
                console.log("tsc success!");
                done();
            }
        }
    };

    for (let i = 0; i < tsCongfig.length; i++) {
        mark++;
        const cmd = ["-b", tsCongfig[i]];
        const tscurl = path.join('', "./node_modules/.bin/tsc.cmd");
        child_process.execFile(tscurl, cmd, (err, stdout, stderr) => {
            if (err) {
                console.log(err, '\n', stdout, '\n', stderr);
            }
            start(err);
        });
    }
}

const options = {
    input: 'src/index.ts',
    output: [
        {
            file: './build/index.cjs.js',
            format: 'cjs'
        },
        {
            file: './build/index.es.js',
            format: 'es'
        },
        {
            file: './build/beautiful.soup.js',
            name: 'BeautifulSoup',
            format: 'iife',
            extend: true,
            globals: { 'BeautifulSoup': 'BeautifulSoup' }
        },
    ],
    onwarn: (waring, warn) => {
        if (waring.code == "CIRCULAR_DEPENDENCY") {
            console.log("warnning Circular dependency:");
            console.log(waring);
        }
    },
    // treeshake: false, //建议忽略
    treeshake: true,
    // treeshake: { moduleSideEffects: false },
    plugins: [
        resolve(),
        typescript({
            tsconfig: workSpaceDir + "/tsconfig.json",
            check: false, //Set to false to avoid doing any diagnostic checks on the code
            tsconfigOverride: { compilerOptions: { removeComments: true } },
            // include: /.*.ts/,
            exclude: /node_modules/,
            cacheRoot: `${workSpaceDir}/.rpt2_cache`,
        }),
        commonjs(),
        cleanup()
    ]
}
function compile() {
    return rollup.rollup(options).then(bundle => {
        return Promise.all(options.output.map(bundle.write));
    }).catch(err => {
        console.log(err);
    });
}

function isElidableOrTraversable(node) {
    switch (node.kind) {
        case ts.SyntaxKind.EnumMember://枚举成员
        case ts.SyntaxKind.EnumDeclaration://枚举声明
        case ts.SyntaxKind.IndexSignature:
        case ts.SyntaxKind.ConstructSignature:
        case ts.SyntaxKind.MethodDeclaration://方法声明
        case ts.SyntaxKind.MethodSignature:
        case ts.SyntaxKind.FunctionDeclaration://函数声明
        case ts.SyntaxKind.PropertyDeclaration://属性声明
        case ts.SyntaxKind.ClassDeclaration://类声明
        case ts.SyntaxKind.InterfaceDeclaration://接口声明
        case ts.SyntaxKind.ModuleDeclaration://模块声明
        case ts.SyntaxKind.ModuleBlock:
        case ts.SyntaxKind.TypeLiteral:
        case ts.SyntaxKind.SyntaxList:
        case ts.SyntaxKind.VariableStatement:
            return true;
    }
    return false;
}
function elide(data) {
    const sourceFile = ts.createSourceFile("input.d.ts", data, ts.ScriptTarget.Latest, true);
    const elisions = [];
    sourceFile.forEachChild(visit);
    const count = elisions.length;
    let result = data;
    while (elisions.length > 0) {
        const e = elisions.pop();
        result = result.substr(0, e[0]) + result.substr(e[1]);
    }
    return { result, count };
    function visit(node) {
        // console.log(111, node.kind, isElidableOrTraversable(node))
        // console.log(222, node.getFullText(), node.getLeadingTriviaWidth())
        // console.log(333, node.getFullStart(), node.getEnd())
        if (isElidableOrTraversable(node)) {
            const trivia = node.getFullText().substr(0, node.getLeadingTriviaWidth());
            if (trivia.indexOf('@internal') >= 0) {
                elisions.push([node.getFullStart(), node.getEnd()]);
            }
            else {
                node.forEachChild(visit);
            }
        }
    }
}
async function removeInternal(done) {
    const fun = (_path) => {
        return new Promise(async (resolve, reject) => {
            const files = fs.readdirSync(_path);
            for (const test of files) {
                const fn = path.join(_path, test);
                const stat = fs.statSync(fn);
                if (stat.isFile()) {
                    if (fn.indexOf(".d.ts") > -1) {
                        const fileContent = fs.readFileSync(fn, { encoding: 'utf-8' });
                        const elided = elide(fileContent).result;
                        fs.writeFileSync(fn, elided, "utf8");
                    }
                } else if (stat.isDirectory()) {
                    await fun(_path + "/" + test);
                }
            }
            resolve()
        });
    }
    await fun('./build')
    done()
}

function cleanJs() {
    const cleanList = ['./build/**/*.js']
    return gulp.src(cleanList, { base: './build' })
        .pipe(strip())
        .on('error', function (err) {
            console.warn(err.toString());
        })
        .pipe(gulp.dest('./build'))
}

async function revise(done) {
    const reviseJS = (_path) => {
        return new Promise(async (resolve, reject) => {
            const files = fs.readdirSync(_path);
            for (const test of files) {
                const fn = path.join(_path, test);
                const stat = fs.statSync(fn);
                if (stat.isFile()) {
                    let fileContent = fs.readFileSync(fn, { encoding: 'utf-8' });
                    fileContent = fileContent.replace(`function runningInNode () {`, `function runningInNode () {\nreturn true;`);
                    /// <reference path="./main/SoupElement.ts" />
                    const libsList = fileContent.match(/[/]+ <reference path=['"][\w-./]+['"] [/]>/g);
                    if (libsList) {
                        for (let i = 0, len = libsList.length; i < len; i++) {
                            const item = libsList[i];
                            const libsName = item.match(/[/]+ <reference path=['"][\w-./]+['"] [/]>/);
                            fileContent = fileContent.replace(libsName[0], '');
                        }
                    }
                    fs.writeFileSync(fn, fileContent, "utf8");
                } else if (stat.isDirectory()) {
                    await reviseJS(_path + "/" + test);
                }
            }
            resolve()
        });
    }
    await reviseJS('./build');
    done();
}

function compressJs() {
    const options = {
        // 混淆配置
        mangle: {
            keep_fnames: true
        }
    }
    const compressJsList = ['./build/index.cjs.js', './build/index.es.js', './build/beautiful.soup.js'];
    return gulp.src(compressJsList)
        .pipe(uglify(options))
        .on('error', function (err) {
            console.warn(err.toString());
        })
        .pipe(rename({ extname: ".min.js" }))
        .pipe(gulp.dest('./build/min'));
}

exports.default = gulp.series(
    clear,
    tsc,
    compile,
    removeInternal,
    cleanJs,
    revise,
    compressJs
)