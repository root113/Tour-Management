/** @jest-config-loader ts-node */
import type { Config } from "jest";

const config: Config = {
    bail: false,                                        //* stop running tests after n failures
    cacheDirectory: '<rootDir>/cache/jest/',            //* directory where jest should store cached dependency info
    clearMocks: true,                                   //* auto clear mock calls, instances, contexts, results before each test
    collectCoverage: false,                             //* whether the coverage info should be collected, significantly slows down the tests!
    collectCoverageFrom: [                              //* patterns of a set of files to collect cov info
        'src/**/*.{ts,tsx,js,jsx}',
        '!src/**/*.d.ts',
        '!src/**/*.test.{ts,tsx,js,jsx}',
        '!src/**/*.spec.{ts,tsx,js,jsx}',
        '!src/**/index.ts',
        '!src/**/types/**',
        '!src/**/constants/**',
        '!src/**/mocks/**'
    ],
    coverageDirectory: '<rootDir>/reports/coverage/',   //* directory of coverage files' output
    coveragePathIgnorePatterns: [                       //* regexp patterns to skip coverage info
        '<rootDir>/node_modules/',
        '<rootDir>/deploy/',
        '<rootDir>/prisma/migrations/',
        '<rootDir>/reports/',
        '<rootDir>/src/generated/'
    ],
    coverageProvider: 'v8',                             //* provider to be used to instrument code for coverage
    coverageThreshold: {                                //* configure min threshold enforcement for coverage results
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        }
    },
    displayName: {                                      //* display name for test results
        name: 'API Test',
        color: 'cyan'
    },
    maxConcurrency: 5,                                  //* limiting the number of tests allowed to run concurrently
    moduleFileExtensions: [                             //* file ext of modules used which jest will look for
        'ts', 
        'tsx', 
        'js', 
        'jsx', 
        'json', 
        'node'
    ],
    openHandlesTimeout: 5000,                           //* print a warning of probable open handles if jest does not exit cleanly this number of ms
    preset: 'ts-jest',                                  //* base config for jest
    randomize: false,                                   //* randomize the order of tests
    reporters: [                                        //* add reporters to jest
        'default',
        ['<rootDir>/jest/reporters/advanced-reporter.ts', {
            showSlowTests: true,
            slowTestThreshold: 500,
            showSummaryTable: true,
            groupByFile: true
        }],
        ['<rootDir>/jest/reporters/json-reporter.ts', {
            outputFile: './reports/jtests/json/test-results.json',
            includeFailureDetails: true
        }]
    ],
    resetMocks: true,                                   //* reset mocks before every test
    rootDir: process.cwd(),                             //* root directory
    roots: [                                            //* dirs to search for tests
        '<rootDir>/src',
        '<rootDir>/__tests__/contract',
        '<rootDir>/__tests__/e2e',
        '<rootDir>/__tests__/endpoint',
        '<rootDir>/__tests__/integration',
        '<rootDir>/__tests__/performance',
        '<rootDir>/__tests__/regression',
        '<rootDir>/__tests__/security',
        '<rootDir>/__tests__/unit'
    ],
    showSeed: true,                                     //* print the seed in the test report summary
    slowTestThreshold: 5,                               //* num of seconds to consider a test as slow & reported in the results
    testEnvironment: 'node',                            //* environment to be used for testing
    testMatch: [                                        //* glob pattern jest uses to detect test files
        '<rootDir>/src/**/*.test.{ts,tsx,js,jsx}',
        '<rootDir>/__tests__/**/*.{ts,tsx,js,jsx}'
    ],
    testPathIgnorePatterns: [                           //* regexp pattern strings that are matched against all test paths before executing the test
        '<rootDir>/jest/reporters/',
        '<rootDir>/node_modules/'
    ],
    testTimeout: 15000,                                 //* timeout of a test in ms
    transform: { '^.+\\.tsx?$': 'ts-jest' },            //* map from regexp to path to transformers
    verbose: true,                                      //* verbose flag
    waitForUnhandledRejections: true,                   //* gives one event loop to handle rejectionHnadled, uncaughtException, unhandledRejection
    watchPathIgnorePatterns: [                          //* regexp patterns to ignore when --watch set
        '<rootDir>/cache/',
        '<rootDir>/reports/',
        '<rootDir>/.gitignore',
        '<rootDir>/.dockerignore',
        '/*.md',
        '<rootDir>/**/*.md'
    ],
};

export default config;