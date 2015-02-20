var childProcess = require('child_process');

module.exports = function(grunt) {

// ========================================================================
// Configure task options

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: {
      css: [
        'css/*.css',
        'tmp/css/*.css'
      ],
      'js': [
        'js/jmylottery*.js'
      ]
    },
    lesslint: {
      src: ['src/less/*.less']
    },
    less: {
      files: {
        expand: true,
        flatten: true,
        cwd: "src/less/",
        src: "*.less",
        dest: "tmp/css",
        ext: ".css"
      }
    },
    cssmin: {
      options: {
        banner: '/**!\n * @name\t\t<%= pkg.name %>\n * @version\t\tv<%= pkg.version %>\n * ' +
        '@date\t\t<%= grunt.template.today("yyyy-mm-dd") %>\n * @copyright\t<%= pkg.copyright %>\n * @source\t\t<%= pkg.repository %>\n * @license\t\t<%= pkg.license %>\n */\n',
        footer: '/* @license-end */'
      },
      minify: {
        expand: true,
        cwd: 'css/',
        src: ['*.css', '!*.min.css'],
        dest: 'css/',
        ext: '.min.css'
      }
    },
    concat: {
      dist_full: {
        src: [
          'js/libs/*.js',
          'src/js/*.js',
          '!js/libs/jmyloader-full-min.js'
        ],
        dest: 'js/jmylottery-withlibs.js'
      },
      dist_nolibs: {
        src: [
          'src/js/*.js'
        ],
        dest: 'js/jmylottery.js'
      },
      dist_css: {
        src: [
          'tmp/css/*.css'
        ],
        dest: 'css/jmylottery.css'
      }
    },
    uglify: {
      build_full: {
        src: 'js/jmylottery-withlibs.js',
        dest: 'js/jmylottery-withlibs.min.js'
      },
      build_nolibs: {
        src: 'js/jmylottery.js',
        dest: 'js/jmylottery.min.js'
      }
    },
    watch: {
      less: {
        files: ['Gruntfile.js', 'package.json', 'src/less/*.less','src/less/**/*.less'],
        tasks: ['css'],
        options: {
          spawn: false
        }
      }
    }
  });

// on watch events configure jshint:all to only run on changed file
//    grunt.event.on('watch', function(action, filepath) {
//        grunt.config(['jshint', 'all'], filepath);
//    });

// ========================================================================
// Initialise

  grunt.loadNpmTasks('grunt-contrib-cssmin');

  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.loadNpmTasks('grunt-lesslint');

  grunt.loadNpmTasks('grunt-contrib-less');

  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.loadNpmTasks('grunt-shell');


// ========================================================================
// Register Tasks

// Run 'grunt test' to view lesslint recommendations
  grunt.registerTask('test', ['lesslint']);

// Run 'grunt csslint' to check LESS quality, and if no errors then
// compile LESS into CSS, combine and minify
  grunt.registerTask('csslint', ['lesslint', 'clean:css', 'less', 'cssmin']);

// Run 'grunt css' to compile LESS into CSS, combine and minify
  grunt.registerTask('css', ['clean:css', 'less', 'concat:dist_css', 'cssmin']);


// 'grunt' will check code quality, and if no errors,
// compile LESS to CSS, and minify and concatonate all JS and CSS
  grunt.registerTask('default', [ 'clean', 'less', 'concat', 'cssmin', 'uglify']);

};