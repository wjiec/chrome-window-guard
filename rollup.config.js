import rollupPluginCopy from "rollup-plugin-copy";
import rollupPluginNodeResolve from "@rollup/plugin-node-resolve";
import rollupPluginTypescript from "@rollup/plugin-typescript";

export default {
  input: "src/background.ts",
  output: {
    dir: "dist",
    format: "cjs",
  },
  watch: {
    include: ["public/**", "src/**"],
  },
  plugins: [
    rollupPluginNodeResolve(),
    rollupPluginTypescript(),
    rollupPluginCopy({
      targets: [{ src: "public/*", dest: "dist" }],
    }),
  ],
};
