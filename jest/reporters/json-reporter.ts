import * as fs from "fs";
import * as path from "path";

import type { Reporter, AggregatedResult } from "@jest/reporters";

interface JsonReporterOptions {
    outputFile?: string;
    includeFailureDetails?: boolean;
}

class JsonJestReporter implements Reporter {
    private options: JsonReporterOptions;
    private results: any = {};

    constructor(globalConfig: any, options: JsonReporterOptions = {}) {
        this.options = {
            outputFile: '../../reports/jtests/json/test-results.json',
            includeFailureDetails: true,
            ...options
        };
    }

    onRunComplete(contexts: any, results: AggregatedResult): void {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                suites: results.numTotalTestSuites,
                tests: results.numTotalTests,
                passed: results.numPassedTests,
                failed: results.numFailedTests,
                pending: results.numPendingTests,
                todo: results.numTodoTests,
                success: results.success
            },
            testResults: results.testResults.map(suite => ({
                filePath: suite.testFilePath,
                numPassingTests: suite.numPassingTests,
                numFailingTests: suite.numFailingTests,
                numPendingTests: suite.numPendingTests,
                testResults: this.options.includeFailureDetails
                    ? suite.testResults.map(test => ({
                        name: test.fullName,
                        status: test.status,
                        duration: test.duration,
                        failureMessages: test.failureMessages
                    }))
                    : undefined
            }))
        };

        const outputPath = path.resolve(this.options.outputFile!);
        const dir = path.dirname(outputPath);

        if(!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
        console.log(`\nTest results written to: ${outputPath}`);
    }
}

export default JsonJestReporter;