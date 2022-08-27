module.exports = {
    /**
     * Application configuration section
     * http://pm2.keymetrics.io/docs/usage/application-declaration/
     */
    apps: [{
        name: 'serverless-service',
        script: './pm2-yarn.js',
        watch: true,
        ignore_watch: [
            "coverage",
            ".esbuild",
            ".serverless",
            "node_modules",
            ".idea",
            ".git",
            "**/*.spec.ts",
            "build",
            "output",
            "third-party",
            "diagrams",
            "tmp"
        ],
        env: {
            COMMON_VARIABLE: 'true'
        },
        env_production: {
            NODE_ENV: 'production'
        },
        args: 'preIntegTest', // NOTE: This is the command that pm2 runs
    }],
};
