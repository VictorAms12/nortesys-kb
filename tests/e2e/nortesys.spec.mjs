import {test,expect} from "@playwright/test";

// Os testes usam apenas usuários e artigos de um Neon de desenvolvimento isolado.
const usuario=process.env.E2E_USUARIO;
const senha=process.env.E2E_SENHA;
const consulta=process.env.E2E_ARTIGO_TERMO;
const artigoUrl=process.env.E2E_ARTIGO_URL;
const requisitos=[
 ["E2E_USUARIO",usuario],["E2E_SENHA",senha],
 ["E2E_ARTIGO_TERMO",consulta],["E2E_ARTIGO_URL",artigoUrl],
];
// A descoberta da suíte (playwright test --list) dispensa segredos; a execução
// continua falhando explicitamente se os dados do Preview de DEV não existirem.
test.beforeAll(()=>{
 for(const [chave,valor] of requisitos){
  if(!valor)throw new Error("Defina "+chave+" para executar os testes de navegador.");
 }
 if(!/^\/artigos\/[a-z0-9-]+\/[a-z0-9-]+$/.test(artigoUrl))
  throw new Error("E2E_ARTIGO_URL deve apontar para artigo disponível no desenvolvimento.");
});

async function autenticar(page){
 await page.goto("/entrar");
 await expect(page.getByRole("heading",{name:"Entrar"})).toBeVisible();
 await page.getByRole("textbox",{name:"Nome de usuário"}).fill(usuario);
 await page.getByLabel("Senha",{exact:true}).fill(senha);
 await page.getByRole("button",{name:"Entrar",exact:true}).click();
 await expect(page).not.toHaveURL(/\/entrar(?:\?|$)/);
 await expect(page.getByRole("navigation",{name:"Principal"})).toBeVisible();
}

test("login abre uma sessão autenticada",async({page})=>{
 await autenticar(page);
 await expect(page.getByRole("heading",{name:"Base de conhecimento"})).toBeVisible();
});

test("atalho / foca a busca e apresenta sugestões de artigos",async({page})=>{
 await autenticar(page);
 await page.getByRole("heading",{name:"Base de conhecimento"}).click();
 await page.keyboard.press("/");
 const busca=page.getByRole("combobox",{name:"Buscar por erro, código ou procedimento"});
 await expect(busca).toBeFocused();
 await busca.fill(consulta);
 const opcoes=page.getByRole("listbox",{name:"Resultados instantâneos"});
 await expect(opcoes).toBeVisible();
 await expect(opcoes.getByRole("option").first()).toBeVisible();
 await page.keyboard.press("Escape");
 await expect(opcoes).toBeHidden();
});

test("busca abre o artigo esperado sem navegar para erro",async({page})=>{
 await autenticar(page);
 await page.goto("/busca?q="+encodeURIComponent(consulta));
 await expect(page.getByRole("heading",{name:"Pesquisar na base"})).toBeVisible();
 const link=page.locator(".lista-resultados").locator("a[href='"+artigoUrl+"']");
 await expect(link).toBeVisible();
 await link.click();
 await expect(page).toHaveURL(new RegExp(artigoUrl.replaceAll("/","\\/")+"(?:\\?|$)"));
 await expect(page.locator("main.pagina-artigo h1")).toBeVisible();
 await expect(page.locator("main.pagina-artigo .secao-artigo").first()).toBeVisible();
});

test("chat permite enviar mensagem e mantém o compositor utilizável",async({page})=>{
 await autenticar(page);
 await page.goto("/chat");
 const campo=page.getByRole("textbox",{name:"Nova mensagem"});
 await expect(campo).toBeEnabled();
 const texto="Teste de fumaça KB "+Date.now().toString(36);
 await campo.fill(texto);
 await page.locator(".chat-compositor").getByRole("button",{name:"Enviar",exact:true}).click();
 await expect(page.locator(".chat-texto-mensagem",{hasText:texto})).toBeVisible();
 await expect(campo).toBeEnabled();
 await expect(campo).toHaveValue("");
});

test("central de notificações abre e fecha sem marcar itens como lidos",async({page})=>{
 await autenticar(page);
 const botao=page.getByRole("button",{name:"Notificações",exact:true});
 await botao.click();
 const painel=page.getByRole("region",{name:"Notificações recebidas"});
 await expect(painel).toBeVisible();
 await expect(painel.getByRole("button",{name:"Marcar lidas"})).toBeVisible();
 await page.keyboard.press("Escape");
 await expect(painel).toBeHidden();
});

test("logout encerra a sessão e protege a página inicial",async({page})=>{
 await autenticar(page);
 await page.getByRole("button",{name:"Abrir menu da conta"}).click();
 await page.getByRole("button",{name:"Sair da conta"}).click();
 await expect(page).toHaveURL(/\/entrar(?:\?|$)/);
 await page.goto("/");
 await expect(page).toHaveURL(/\/entrar(?:\?|$)/);
});
