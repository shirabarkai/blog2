module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    setupFilesAfterEnv: ['./tests/setup.ts'],
    moduleFileExtensions: ['ts', 'js'],
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
    testMatch: ['**/tests/**/*.test.ts'],
    coveragePathIgnorePatterns: ['/node_modules/'],
    testTimeout: 10000,
    verbose: true,
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'clover', 'html'],
    collectCoverageFrom: [
        'src/**/*.{js,ts}',
        '!src/server.ts',
        '!src/config/*.ts',
        '!src/types/*.ts'
    ],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        }
    }
}; 