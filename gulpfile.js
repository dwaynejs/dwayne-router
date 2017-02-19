const gulp = require('gulp');
const rollup = require('rollup');
const rollupStream = require('rollup-stream');
const source = require('vinyl-source-stream');
const watch = require('rollup-watch');

const createServer = require('./server');

const rollupDevConfig = require('./rollup.dev.config');
const rollupBuildConfig = require('./rollup.build.config');
const rollupTestConfig = require('./rollup.test.config');
const config = require('./config.json');

const devServer = createServer();
const testServer = createServer();

gulp.task('default', ['server:dev'], () => {
  const watcher = watch(rollup, rollupDevConfig);

  watcher.on('event', (event) => {
    console.log(event);
  });
});

gulp.task('build', () => (
  rollupStream(rollupBuildConfig)
    .pipe(source('Router.js'))
    .pipe(gulp.dest('./'))
));

gulp.task('test', ['server:test'], () => {
  const watcher = watch(rollup, rollupTestConfig);

  watcher.on('event', (event) => {
    console.log(event);
  });
});

gulp.task('server:dev', () => (
  devServer.listen(config.devServer.port)
));

gulp.task('server:test', () => (
  testServer.listen(config.testServer.port)
));
