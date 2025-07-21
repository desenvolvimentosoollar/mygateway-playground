using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using MyGateway.ApiAsGatewayApi;
using Refit;
using System.Net.Http;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var baseurl = builder.Configuration["MyGatewayApi:BaseUrl"]!;
var timeout = builder.Configuration["MyGatewayApi:Timeout"]!;


static object CreateResponse(ApiResponse<string> apiResponse)
{

    try
    {
        if (!string.IsNullOrEmpty(apiResponse.Content))
        {
            return Results.Ok(JsonSerializer.Deserialize<Dictionary<string, object>>(apiResponse.Content));
        }

        return Results.BadRequest(JsonSerializer.Deserialize<Dictionary<string, object>>(apiResponse.Error.Content));
    }
    catch (Exception ex)
    {
        return Results.BadRequest(ex);
    }
}

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(
        builder =>
        {
            builder.AllowAnyOrigin()
                   .AllowAnyMethod()
                   .AllowAnyHeader();
        });
});

builder.Services.AddRefitClient<IMyGatewayApi>()
                 .ConfigurePrimaryHttpMessageHandler(() =>
                 {
                     return new HttpClientHandler
                     {
                         //Ignora validação de certificado — apenas para dev/teste!
                         ServerCertificateCustomValidationCallback = (message, cert, chain, errors) => true
                     };
                 })
                .ConfigureHttpClient(httpClient =>
                {
                    httpClient.BaseAddress = new Uri(baseurl);
                    httpClient.Timeout = TimeSpan.FromSeconds(int.Parse(timeout));
                    httpClient.DefaultRequestVersion = new Version(2, 0);
                });

var app = builder.Build();

app.UseHttpsRedirection();

app.UseSwagger();
app.UseCors();
app.UseSwaggerUI();

app.UseAuthorization();

app.MapPost("/authentication/v1/auth", async (HttpRequest httpRequest,
                                        [FromBody] Dictionary<string, object> request,
                                        [FromServices] IMyGatewayApi api) =>
{


    return CreateResponse(await api.Authentication(request, httpRequest.Headers["x-api-key"].ToString()));

});

app.MapPost("/payments/v1/create", async (HttpRequest httpRequest,
                                        [FromBody] Dictionary<string, object> request,
                                        [FromServices] IMyGatewayApi api) =>
{

    return CreateResponse(await api.Create(request, httpRequest.Headers["x-api-key"].ToString(), httpRequest.Headers["Authorization"].ToString()));
});

app.MapPost("/payments/v1/creditcard/generate/token", async (HttpRequest httpRequest,
                                        [FromBody] Dictionary<string, object> request,
                                        [FromServices] IMyGatewayApi api) =>
{

    return CreateResponse(await api.CreditCardGenerateToken(request, httpRequest.Headers["x-api-key"].ToString(), httpRequest.Headers["Authorization"].ToString()));
});

app.MapPost("/antifraud/v1/sdk/3ds/initialize", async (HttpRequest httpRequest,
                                        [FromBody] Dictionary<string, object> request,
                                        [FromServices] IMyGatewayApi api) =>
{

    return CreateResponse(await api.AntifraudeSdkInitialize3DS(request, httpRequest.Headers["x-api-key"].ToString(), httpRequest.Headers["Authorization"].ToString()));
});

app.MapPost("/payments/v1/creditcard/antifraud/validate/3ds", async (HttpRequest httpRequest,
                                        [FromBody] Dictionary<string, object> request,
                                        [FromServices] IMyGatewayApi api) =>
{

    return CreateResponse(await api.CreditCardAntifraudValidate3DS(request, httpRequest.Headers["x-api-key"].ToString(), httpRequest.Headers["Authorization"].ToString()));
});

app.MapGet("/payments/v1/situation/{paymentId}", async (HttpRequest httpRequest,
                                        [FromRoute] string paymentId,
                                        [FromServices] IMyGatewayApi api) =>
{

    return CreateResponse(await api.Situation(paymentId, httpRequest.Headers["x-api-key"].ToString(), httpRequest.Headers["Authorization"].ToString()));
});


app.Run();




