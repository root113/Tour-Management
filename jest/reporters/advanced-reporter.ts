import chalk from "chalk";
import Table from "cli-table3";

import type { Reporter, Test, AggregatedResult } from "@jest/reporters";

interface AdvancedReporterOptions {
    showSlowTests?: boolean;
    slowTestThreshold?: number;
    showSummaryTable?: boolean;
    groupByFile?: boolean;
}

class AdvancedJestReporter implements Reporter {
    private options: AdvancedReporterOptions;
    private startTime: number = 0;
    private testTimings: Array<{
        path: string;
        name: string;
        duration: number;
    }> = [];

    constructor(globalConfig: any, options: AdvancedReporterOptions = {}) {
        this.options = {
            showSlowTests: true,
            slowTestThreshold: 1000, // ms
            showSummaryTable: true,
            groupByFile: true,
            ...options
        };
    }

    onRunStart(): void {
        this.startTime = Date.now();
        console.log(chalk.blue.bold('\nStarting Jest Test Run...\n'));
    }

    onTestResult(test: Test, testResult: any): void {
        testResult.testResults.forEach((result: any) => {
            this.testTimings.push({
                path: test.path,
                name: result.fullName,
                duration: result.duration || 0
            });
        });
    }

    onRunComplete(contexts: any, results: AggregatedResult): void {
        const duration = Date.now() - this.startTime;

        if(this.options.showSummaryTable) this.printSummaryTable(results, duration);
        if(this.options.showSlowTests) this.printSlowTests();
        if(results.numFailedTests > 0) this.printFailureDetails(results);

        this.printVerdict(results);
    }

    private printSummaryTable(results: AggregatedResult, duration: number): void {
        const table = new Table({
            head: [
                chalk.white.bold('Metric'),
                chalk.white.bold('Count'),
                chalk.white.bold('Status')
            ],
            colWidths: [20, 13, 10]
        });

        const status = results.numFailedTests > 0
            ? chalk.red('FAILED!')
            : chalk.green('PASSED');

        table.push(
            ['Test Suites', results.numTotalTestSuites.toString(), status],
            ['Tests', results.numTotalTests.toString(), '📝'],
            ['Passed', results.numPassedTests.toString(), chalk.green('✓')],
            ['Failed', results.numFailedTests.toString(), results.numFailedTests > 0 ? chalk.red('✗') : ''],
            ['Pending', results.numPendingTests.toString(), '⌛'],
            ['Duration', `${(duration / 1000).toFixed(2)}s`, '⏰']
        );

        console.log('\n' + table.toString());
    }

    private printSlowTests(): void {
        const slowTests = this.testTimings
            .filter(t => t.duration > this.options.slowTestThreshold!)
            .sort((a, b) => b.duration - a.duration)
            .slice(0, 5); // show top 5 slowest tests
        
        if(slowTests.length > 0) {
            console.log(chalk.yellow.bold('\n🐌 Slowest Tests:'));
            const slowTable = new Table({
                head: [chalk.white('Test'), chalk.white('Duration')],
                colWidths: [50, 15]
            });

            slowTests.forEach(test => {
                const durationColor = test.duration > 2000
                    ? chalk.red
                    : chalk.yellow;
                
                slowTable.push([
                    test.name.length > 45 ? test.name.substring(0, 42) + '...' : test.name,
                    durationColor(`${test.duration}ms`)
                ]);
            });

            console.log(slowTable.toString());
        }
    }

    private printFailureDetails(results: AggregatedResult): void {
        console.log(chalk.red.bold('\n❌ Failure Details:'));

        results.testResults.forEach((suite) => {
            if(suite.numFailingTests > 0) {
                const failures = suite.testResults.filter(t => t.status === 'failed');
                console.log(`\n${suite.testFilePath}`);

                failures.forEach((test, index) => {
                    console.log(chalk.red(` ${index + 1}. ${test.fullName}`));

                    test.failureMessages?.forEach((message, msgIndex) => {
                        const lines = message.split('\n');
                        lines.slice(0, 3).forEach(line => {
                            console.log(chalk.gray(`    ${line}`));
                        });

                        if(lines.length > 3) console.log(chalk.gray(`   ... and ${lines.length - 3} more lines`));
                    });
                });
            }
        });
    }

    private printVerdict(results: AggregatedResult): void {
        console.log('\n' + '='.repeat(60));

        if(results.numFailedTests === 0) {
            console.log(chalk.green.bold('🎉 All tests passed'));
        } else console.log(chalk.red.bold(`💥 ${results.numFailedTests} test(s) failed!`));

        console.log('='.repeat(60));
    }
}

export default AdvancedJestReporter;