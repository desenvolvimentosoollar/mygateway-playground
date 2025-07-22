# MyGateway Playground

Bem-vindo ao MyGateway Playground\! Este projeto foi desenhado para demonstrar a integração entre uma aplicação frontend (Web) com o SDK de 3DS MyGateway e uma API backend com comunicação com a API de pagamentos MyGateway. Em caso de dúvidas sobre o funcionamento dos nossos produtos acesse [nossa documentação](https://app.mygateway.com.br/documentacao/sintetica).

## Visão Geral do Projeto

O projeto é composto por duas aplicações distintas:

  * **API**: Localizada na pasta `/api`, é a aplicação backend responsável pela exposição dos endpoints e comunicação com a API externa de pagamentos MyGateway.
  * **Web**: Encontrada na pasta `/web`, é a aplicação frontend construída com CSHTML e JavaScript, que consome os dados da API.

## Pré-requisitos

  * [.NET 8.0 SDK](https://dotnet.microsoft.com/download) instalado.
  * Um ambiente de desenvolvimento C\#, como o Visual Studio ou Visual Studio Code.

## 🚀 Como Começar

Para utilizar o MyGateway Playground, siga os passos abaixo.

### 1\. Configuração da Aplicação Web

Antes de iniciar a aplicação, você precisará configurar suas credenciais de acesso à API.

#### a. Configurar a Chave da API (API Key)

1.  Navegue até a pasta `/web/MyGateway.Playground/Pages`.

2.  Abra o arquivo `Index.cshtml`.

3.  Localize a meta tag com o nome `_api_key`.

4.  Insira a sua chave de API no atributo `content`.

    ```html
    <meta name="_api_key" content="SUA_API_KEY" />
    ```

#### b. Configurar o Client ID e o Client Secret

1.  Na pasta `/web/MyGateway.Playground/wwwroot`, localize e abra o arquivo `script.js`.

2.  No topo do arquivo, você encontrará as constantes `CLIENT_ID` e `CLIENT_SECRET`.

3.  Altere os valores para as suas credenciais.

    ```javascript
    const CLIENT_ID = 'SEU_CLIENT_ID';
    const CLIENT_SECRET = 'SEU_CLIENT_SECRET';
    ```

### 2\. Executando o Projeto

Ambas as aplicações precisam estar em execução simultaneamente para que a comunicação funcione corretamente.

1.  Abra a solution do projeto no Visual Studio.
2.  Inicie a aplicação **API** em modo **HTTPS**. Por padrão, ela deverá rodar na porta `7183`.
3.  Inicie a aplicação **Web** também em modo **HTTPS**.

### ⚙️ Ajuste da Porta da API (Opcional)

Por padrão, a aplicação Web está configurada para fazer requisições para a API na porta `7183`. Se, por algum motivo, sua API estiver rodando em uma porta diferente, você precisará ajustar o arquivo de script.

1.  Abra o arquivo `script.js` na pasta `/web/MyGateway.Playground/wwwroot`.

2.  No topo do arquivo, junto das demais constantes, você encontrará a constante `API_PORT`.

3.  Altere o valor da constante de `7183` para a porta correta em que sua API está sendo executada.

    ```javascript
    const API_PORT = SUA_PORTA;
    ```