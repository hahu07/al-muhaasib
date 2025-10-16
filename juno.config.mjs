import { defineConfig } from "@junobuild/config";

/** @type {import('@junobuild/config').JunoConfig} */
export default defineConfig({
  satellite: {
    ids: {
      development: "u6s2n-gx777-77774-qaaba-cai",
      production: "<PROD_SATELLITE_ID>",
    },
    source: "out",
    predeploy: ["npm run build"],
  },
});
