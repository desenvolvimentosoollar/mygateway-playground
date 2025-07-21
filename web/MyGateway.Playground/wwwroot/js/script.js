const API_CLIENT_ID = ""; //Coloque seu CLIENT ID aqui
const API_CLIENT_SECRET = ""; //Coloque seu CLIENT SECRET aqui

const sessionId = crypto.randomUUID();

function loadScreenData() {
    $.ajax({
        url: "https://api.ipify.org/?format=json",
        type: "GET",
        success: function (dados) {
            $("#ipAddress").val(dados.ip);
        },
        error: function (error) {
            console.log(error);
        },
    });
}

async function getAuthToken() {
    const authData = btoa(`${API_CLIENT_ID}:${API_CLIENT_SECRET}`);

    return $.ajax({
        async: true,
        crossDomain: true,
        url: "https://localhost:7183/authentication/v1/auth",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "*/*",
            "x-api-key": $('meta[name="_api_key"]').attr("content")
        },
        processData: false,
        data: JSON.stringify({
            authData,
        }),
        success: (response) => {
            console.log(response);
            sessionStorage.setItem("authToken", response.authenticationToken);

            return response;
        },
        error: function (err, resp, text) {
            console.error("Erro na autenticação", err);
            return null;
        },
    });
}

async function initializeSDK() {
    const authRes = await getAuthToken();
    const authToken = authRes.authenticationToken;

    return $.ajax({
        async: true,
        crossDomain: true,
        url: "https://localhost:7183/antifraud/v1/sdk/3ds/initialize",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "*/*",
            "x-api-key": $('meta[name="_api_key"]').attr("content"),
            Authorization: authToken,
        },
        processData: false,
        data: JSON.stringify({
            location: window.location.origin,
            fingerprintSessionId: sessionId,
        }),
    })
        .done(function (response) {
            return response;
        })
        .fail(function (failResponse) {
            console.error("Erro na inicialização do SDK", failResponse);
            return null;
        });
}

var threeDs;

async function creditCardPayment(callback) {
    const installments = $("#installments").val();

    if (!installments) {
        console.error("É obrigatório informar o número de parcelas");
        return;
    }

    const init3ds = await initializeSDK();
    const ccnumValue = $("#card-number").val().replace(/\s/g, "");
    $("#ccnum").val(ccnumValue);
    console.log(init3ds, sessionId);

    try {
        threeDs = new MyGateway3DS(
            "ccnum",
            validateChallengeCallback,
            1,
            sessionId,
            init3ds
        );
    } catch (error) {
        console.error("ERRO INICIALIZAÇÃO SDK", error);
        return null;
    }

    await threeDs.Authorization3ds();
    const code3ds = threeDs.GetThreeDsCode();
    console.log("CÓDIGO 3DS", code3ds);
    $("#code3DS").val(code3ds);
    const payment = await callPayment(code3ds, callback);
    return payment;
}

function validateChallengeCallback(jwt, statusChallenge) {
    console.log("Status Challenge: " + statusChallenge);
    const authToken = sessionStorage.getItem('authToken');

    if (statusChallenge == "Cancelled") {
        console.log("Desafio cancelado");
        return;
    }

    const validationData = getValidationData(jwt);
    const settings = {
        async: true,
        crossDomain: true,
        url: "https://localhost:7183/payments/v1/creditcard/antifraud/validate/3ds",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "*/*",
            "x-api-key": $('meta[name="_api_key"]').attr("content"),
            Authorization: authToken,
        },
        processData: false,
        data: JSON.stringify(validationData),
    };

    $.ajax(settings)
        .done(function (response, status) {
            console.log("Status: " + status);
            console.log("Validation Response: " + JSON.stringify(response));
            validateResponse(status);
        })
        .fail(function (failResponse) {
            console.error("Erro na validação da resposta", failResponse);
        });
}

function validateResponse(status) {
    if (status == 'success') {
        alert("Desafio concluído, acompanhe o polling da situação do pagamento através do console");
        console.log(
            "Desafio executado com sucesso, aguardando confirmação do pagamento"
        );
        const paymentId = $('#paymentId').val();
        setInterval(async () => {
            await getPaymentStatus(paymentId);
        }, 5000)
    } else {
        console.log(
            "Seu emissor informou que não foi possivel continuar com o pagamento"
        );
    }
}

function getValidationData(jwt) {
    const paymentId = $("#paymentId").val();
    const code3DS = $("#code3DS").val();
    console.log("PAYMENT ID", paymentId);

    return {
        code3DS,
        validateToken: jwt,
        paymentId,
    };
}

async function callPayment(code3DS, callback) {
    getPaymentData(code3DS);
    return await setCardToken(callback);
}

function getPaymentData(code3DS) {
    mountDeviceFingerprint();
    return {
        code3DS,
    };
}

function mountDeviceFingerprint() {
    const httpBrowserColorDepth = screen.colorDepth.toString();
    $("#httpBrowserColorDepth").val(httpBrowserColorDepth);

    const httpBrowserJavaEnabled = navigator.javaEnabled() ? "Y" : "N";
    $("#httpBrowserJavaEnabled").val(httpBrowserJavaEnabled);

    const httpBrowserJavaScriptEnabled = "Y";
    $("#httpBrowserJavaScriptEnabled").val(httpBrowserJavaScriptEnabled);

    const httpBrowserLanguage = navigator.language || navigator.userLanguage;
    $("#httpBrowserLanguage").val(httpBrowserLanguage);

    const httpBrowserScreenHeight = window.innerHeight.toString();
    $("#httpBrowserScreenHeight").val(httpBrowserScreenHeight);

    const httpBrowserScreenWidth = window.innerWidth.toString();
    $("#httpBrowserScreenWidth").val(httpBrowserScreenWidth);

    const httpBrowserTimeDifference = new Date().getTimezoneOffset().toString();
    $("#httpBrowserTimeDifference").val(httpBrowserTimeDifference);

    const httpAcceptContent = "*/*";
    $("#httpAcceptContent").val(httpAcceptContent);

    const httpAcceptBrowserValue = "application/json";
    $("httpAcceptBrowserValue").val(httpAcceptBrowserValue);

    const userAgentBrowserValue = navigator.userAgent;
    $("#userAgentBrowserValue").val(userAgentBrowserValue);
}

async function setCardToken(callback) {
    var success = true;
    const authToken = sessionStorage.getItem('authToken');

    $.ajax({
        url: "https://localhost:7183/payments/v1/creditcard/generate/token",
        type: "POST",
        headers: {
            "x-api-key": $('meta[name="_api_key"]').attr("content"),
            "Authorization": authToken,
            "Content-Type": "application/json"
        },
        data: JSON.stringify({
            cardNumber: $("#ccnum").val(),
            transactionId: crypto.randomUUID(),
        }),
        success: async function (dados) {
            $("#payment_card_number").val(dados.data.numberToken);
            callback();
        },
        error: function (error) {
            console.error("ERRO NO TOKEN DO CARTÃO", error);
            success = false;
        },
    });
    return success;
}

function treatEnrollmentResponse(response) {
    const data = response?.data?.antifraud[0]?.value;
    const objEnrollmentToThreeDS = data ? JSON.parse(data) : {};
    console.log(
        "3DS protocol version: " + objEnrollmentToThreeDS?.threeDsVersion ??
        "Sem 3DS"
    );
    console.log(objEnrollmentToThreeDS);
    let status = "Fail";
    if (objEnrollmentToThreeDS && objEnrollmentToThreeDS.status) {
        status = objEnrollmentToThreeDS.status;
    } else if (response.error) {
        status = "Fail";
    } else if (response.returncode == 200) {
        status = "Success"; //status apenas do front
    }

    switch (status) {
        case "Fail":
            console.log("falhou.");
            break;
        case "Success":
        case "Attempt":
        case "Silent":
            alert("Pagamento realizado");
            console.log("Pagamento realizado");
            break;
        default: //Challange
            console.log("Step-up.");
            threeDs.InitChallenge(
                objEnrollmentToThreeDS.acsUrl,
                objEnrollmentToThreeDS.pareq,
                objEnrollmentToThreeDS.authenticationTransactionId
            );
            break;
    }
}

async function getPaymentStatus(paymentId) {
    const authToken = sessionStorage.getItem('authToken');

    $.ajax({
        url: `https://localhost:7183/payments/v1/situation/${paymentId}`,
        type: "GET",
        async: true,
        headers: {
            "x-api-key": $('meta[name="_api_key"]').attr("content"),
            "Authorization": authToken,
        },
        success: async function (result) {
            console.log("Status do Pagamento:", result.situation);
        },
        error: function (error) {
            console.error("ERRO NA BUSCA PELO STATUS DO PAGAMENTO", error);
        },
    });
}

document.addEventListener("DOMContentLoaded", function () {
    loadScreenData();
    $("#referer").val(document.referrer);
    $("#user_agent").val(navigator.userAgent);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                $("#latitude").val(position.coords.latitude.toString());
                $("#longitude").val(position.coords.longitude.toString());
                $("#accuracy").val(position.coords.accuracy.toString());
                $("#timestamp").val(position.timestamp.toString());
            },
            (error) => { }
        );
    }
    const form = document.getElementById("checkout-form");

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        let isValid = true;
        const requiredFields = form.querySelectorAll("[required]");

        requiredFields.forEach((field) => {
            if (!field.value.trim()) {
                isValid = false;
                field.classList.add("error");
                console.log(`Campo obrigatório não preenchido: ${field.name}`);
            } else {
                field.classList.remove("error");
            }
        });

        if (isValid) {
            await creditCardPayment(() => {
                const authToken = sessionStorage.getItem('authToken');

                const phone = $("#phone")
                    .val()
                    .replace(/[\s\-\(\)]/g, "");
                const ddd = phone.substring(0, 2);
                const phoneNumber = phone.substring(2);
                const [expirationMonth, expirationYear] = $("#card-expiry")
                    .val()
                    .split("/");

                const postData = {
                    paymentType: 3,
                    creditCard: {
                        clientChargeId: crypto.randomUUID(),
                        payment: {
                            value: 100,
                            installments: parseInt($("#installments").val()),
                        },
                        cardInfo: {
                            numberToken: $("#payment_card_number").val(),
                            cardHolderName: $("#card-name").val(),
                            securityCode: $("#card-cvv").val(),
                            expirationMonth: parseInt(expirationMonth),
                            expirationYear: 2000 + parseInt(expirationYear),
                        },
                        sellerInfo: {
                            softDescriptor: "PAG*MYGATEWAY",
                        },
                        antifraud: {
                            theeDs: {
                                threeDsType: 1,
                                items: {
                                    code3DS: $("#code3DS").val(),
                                    urlSite3DS: "https://mygateway.com.br",
                                },
                            },
                            fingerprint: {
                                sessionId: sessionId,
                                channel: 1,
                                deviceInfo: {
                                    httpAcceptBrowserValue: "application/json",
                                    httpAcceptContent: $("#httpAcceptContent").val(),
                                    httpBrowserLanguage: $("#httpBrowserLanguage").val(),
                                    httpBrowserJavaEnabled: $("#httpBrowserJavaEnabled").val(),
                                    httpBrowserJavaScriptEnabled: $(
                                        "#httpBrowserJavaScriptEnabled"
                                    ).val(),
                                    httpBrowserColorDepth: $("#httpBrowserColorDepth").val(),
                                    httpBrowserScreenHeight: $("#httpBrowserScreenHeight").val(),
                                    httpBrowserScreenWidth: $("#httpBrowserScreenWidth").val(),
                                    httpBrowserTimeDifference: $(
                                        "#httpBrowserTimeDifference"
                                    ).val(),
                                    userAgentBrowserValue: $("#userAgentBrowserValue").val(),
                                },
                                network: {
                                    ip: $("#ipAddress").val(),
                                    userAgent: $("#user_agent").val(),
                                    referer: $("#referer").val(),
                                },
                                location: {
                                    latitude: $("#latitude").val(),
                                    longitude: $("#longitude").val(),
                                    accuracy: $("#accuracy").val(),
                                    timestamp: $("#timestamp").val(),
                                },
                            },
                        },
                        customer: {
                            name: $("#name").val(),
                            document: $("#document")
                                .val()
                                .replace(/[\-\.]/g, ""),
                            email: $("#email").val(),
                            phoneNumber: phoneNumber,
                            phoneNumberDDD: ddd,
                            mobilePhoneNumber: phoneNumber,
                            mobilePhoneNumberDDD: ddd,
                            address: {
                                street: $("#street").val(),
                                number: $("#number").val(),
                                neighborhood: $("#neighborhood").val(),
                                zipcode: $("#zipcode").val(),
                                city: $("#city").val(),
                                complement: "",
                                state: $("#state").val(),
                                country: "BR",
                            },
                        },
                        items: [
                            {
                                id: crypto.randomUUID(),
                                name: "Produto Exemplo 1",
                                value: 100,
                                amount: 1,
                            },
                        ],
                    },
                };

                $.ajax({
                    url: 'https://localhost:7183/payments/v1/create',
                    data: JSON.stringify(postData),
                    dataType: "JSON",
                    async: true,
                    type: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": $('meta[name="_api_key"]').attr("content"),
                        Authorization: authToken,
                    },
                    success: function (result) {
                        $("#paymentId").val(result.data.paymentId);
                        treatEnrollmentResponse(result);
                    },
                    error: function (err, resp, text) {
                        console.error("Erro confirmação do pagamento", err);
                    },
                });
            });
        } else {
            alert("Por favor, preencha todos os campos obrigatórios.");
        }
    });

    form.querySelectorAll("[required]").forEach((field) => {
        field.addEventListener("input", () => {
            if (field.value.trim()) {
                field.classList.remove("error");
            }
        });
    });
});

const style = document.createElement("style");
style.innerHTML = `
    .error {
        border-color: #dc3545 !important;
        box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.25) !important;
    }
`;
document.head.appendChild(style);
