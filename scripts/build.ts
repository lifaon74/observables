import {
  BuilderProgram, createIncrementalCompilerHost, createIncrementalProgram,
  IncrementalProgramOptions, sys
} from 'typescript';
import * as $path from 'path';

// syntax: <fnc name> arg1 value1

// testArgumentParser();

async function build() {
  // const root: string = $path.join(__dirname, '../../../');
  //
  // const options: IncrementalProgramOptions<BuilderProgram> = {
  //   rootNames: [$path.join(root, 'scripts/build.ts')],
  //   options: {
  //     outDir: './dist2'
  //   }
  // };
  //
  // const host = createIncrementalCompilerHost({}, sys);
  // const builderProgram = createIncrementalProgram(options);
  // var exitStatus = emitFilesAndReportErrorsAndGetExitStatus(builderProgram, input.reportDiagnostic || createDiagnosticReporter(system), function (s) {
  //   return host.trace && host.trace(s);
  // }, input.reportErrorSummary || input.options.pretty ? function (errorCount) {
  //   return system.write(getErrorSummaryText(errorCount, system.newLine));
  // } : undefined);
  // // if (input.afterProgramEmitAndDiagnostics)
  // //   input.afterProgramEmitAndDiagnostics(builderProgram);
}

build();




