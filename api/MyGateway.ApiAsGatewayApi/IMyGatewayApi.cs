using Refit;

namespace MyGateway.ApiAsGatewayApi
{
    public interface IMyGatewayApi
    {
        [Post("/authentication/v1/auth")]
        Task<ApiResponse<string>> Authentication([Body] Dictionary<string, object> request, [Header("x-api-key")] string apikey);

        [Post("/payments/v1/create")]
        Task<ApiResponse<string>> Create([Body] Dictionary<string, object> request, [Header("x-api-key")] string apikey, [Header("Authorization")] string authorization);

        [Post("/payments/v1/creditcard/generate/token")]
        Task<ApiResponse<string>> CreditCardGenerateToken([Body] Dictionary<string, object> request, [Header("x-api-key")] string apikey, [Header("Authorization")] string authorization);

        [Post("/antifraud/v1/sdk/3ds/initialize")]
        Task<ApiResponse<string>> AntifraudeSdkInitialize3DS([Body] Dictionary<string, object> request, [Header("x-api-key")] string apikey, [Header("Authorization")] string authorization);

        [Post("/payments/v1/creditcard/antifraud/validate/3ds")]
        Task<ApiResponse<string>> CreditCardAntifraudValidate3DS([Body] Dictionary<string, object> request, [Header("x-api-key")] string apikey, [Header("Authorization")] string authorization);

        [Get("/payments/v1/situation/{paymentId}")]
        Task<ApiResponse<string>> Situation([AliasAs("paymentId")] string paymentId, [Header("x-api-key")] string apikey, [Header("Authorization")] string authorization);
    }
}
