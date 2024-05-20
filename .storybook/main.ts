import path from "path";
// import remarkGfm from "remark-gfm";
import type { StorybookConfig } from "@storybook/react-webpack5";

const config: StorybookConfig = {
    stories: ["../packages/**/*.stories.js", "./welcome.mdx"],

    addons: [
        path.resolve("./.storybook/uploadyPreset"),
        "@storybook/addon-links",
        "@storybook/addon-essentials",
        "@storybook/addon-interactions",
        // {
        //     name: '@storybook/addon-docs',
        //     options: {
        //         mdxPluginOptions: {
        //             mdxCompileOptions: {
        //                 remarkPlugins: [remarkGfm],
        //             },
        //         },
        //     }
        // },
        "@storybook/addon-webpack5-compiler-babel"
    ],

    framework: "@storybook/react-webpack5",
    //     {
    //     name:
    //     options: {},
    // },

    core: {
        disableTelemetry: true
    },

    // typescript: {
    //     reactDocgen: "react-docgen-typescript"
    // }
};

export default config;
