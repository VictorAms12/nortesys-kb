import {defineConfig,devices} from "@playwright/test";

// O runner é provisionado separadamente: nenhuma dependência é adicionada ao projeto.
const url=process.env.E2E_BASE_URL||"http://127.0.0.1:3000";
const endereco=new URL(url);
const local=["localhost","127.0.0.1"].includes(endereco.hostname);
if(!local&&process.env.E2E_CONFIRM_DEVELOPMENT!=="sim"){
 throw new Error("Testes remotos exigem E2E_CONFIRM_DEVELOPMENT=sim e banco de desenvolvimento.");
}

export default defineConfig({
 testDir:"./tests/e2e",
 testMatch:"**/*.spec.mjs",
 timeout:45_000,
 expect:{timeout:15_000},
 workers:1,
 retries:0,
 reporter:[["list"]],
 outputDir:".local/playwright-results",
 use:{
  ...devices["Desktop Chrome"],
  baseURL:endereco.origin,
  trace:"off",
  screenshot:"off",
  video:"off",
  actionTimeout:15_000,
 },
 webServer:process.env.E2E_START_SERVER==="1"?{
  command:"npm run dev",
  url:endereco.origin+"/entrar",
  reuseExistingServer:true,
  timeout:120_000
 }:undefined,
});
