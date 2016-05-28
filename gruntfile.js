﻿module.exports = function (grunt) {   
    grunt.initConfig({
        ts: {
            build: {
                src: ["scripts/**/*.ts", "typings/browser.d.ts"],
                outDir: "dist",
                tsconfig: true
            },
            options: {
                fast: 'never'
            }
        },
        exec: {
            package: {
                command: "tfx extension create --manifest-globs vss-extension.json",
                stdout: true,
                stderr: true
            },
            publish: {
                command: "tfx extension publish --service-url https://marketplace.visualstudio.com --manifest-globs vss-extension.json",
                stdout: true,
                stderr: true
            }
        },
        copy: {
            scripts: {
                files: [{
                    expand: true, 
                    flatten: true, 
                    src: ["node_modules/vss-web-extension-sdk/lib/VSS.SDK.min.js"], 
                    dest: "dist",
                    filter: "isFile" 
                }]
            }
        },
        
        clean: ["scripts/**/*.js", "*.vsix", "dist"]
    });

    grunt.loadNpmTasks("grunt-ts");
    grunt.loadNpmTasks("grunt-exec");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.registerTask("build", ["ts:build", "copy:scripts"]);
    grunt.registerTask("package", ["build", "exec:package"]);
    grunt.registerTask("publish", ["default", "exec:publish"]);        
    
    grunt.registerTask("default", ["package"]);
};