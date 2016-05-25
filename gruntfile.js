module.exports = function (grunt) {   
   

    grunt.initConfig({
        ts: {
            build: {
                src: ["scripts/**/*.ts"],
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
                    src: ["node_modules/vss-web-extension-sdk/lib/VSS.SDK.min.js", "node_modules/moment/min/moment.min.js"], 
                    dest: "scripts",
                    filter: "isFile" 
                }]
            }
        },
        clean: ["scripts/**/*.js", "*.vsix"]
    });
    


    grunt.registerTask('typings', 'A Grunt plugin for typings', function() {
        var options = this.options({
          cwd: process.cwd()
        });

        var typings = require('typings-core');

        var done = this.async();

        var promise = typings.install(options);
        promise.then(function (tree) {
          done(true);
        }, function (err) {
          grunt.log.fail('error!');
          grunt.log.fail(err.stack);
          done(false);
        });
    });



    grunt.loadTasks("typings");
    grunt.loadNpmTasks("grunt-ts");
    grunt.loadNpmTasks("grunt-exec");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.registerTask("build", ["typings", "ts:build", "copy:scripts"]);
    grunt.registerTask("package", ["build", "exec:package"]);
    grunt.registerTask("publish", ["default", "exec:publish"]);        
    
    grunt.registerTask("default", ["package"]);
};