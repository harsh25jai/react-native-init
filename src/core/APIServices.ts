import Config from "react-native-config";
import retry from 'async-retry';

export const GET = "GET"
export const POST = "POST"
export const PUT = "PUT"
export const DELETE = "DELETE"

export const BASE_URL = Config.URL ? Config.URL : 'https://example.com';

interface RequestParams {
    endpoint: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
    body?: BodyInit_ | undefined;
    abortSignal?: AbortSignal | undefined;
    headerType?: "FORMDATA" | "JSON";
    bodyType?: "JSON";
}

const getHeaders = (headerType?: string | undefined) => {
    return {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        // 'user_login_token': user_login_token,
        // 'Authorization': `${token_type} ${access_token}`,
    }
}

export const fetch_retry = async ({ endpoint, method, body, abortSignal, headerType, bodyType }: RequestParams) => {
    return await retry(
        async () => {
            try {
                endpoint = BASE_URL + endpoint;

                let header = getHeaders(headerType);
                // POST | PUT Requests block
                if (method === POST || method === PUT) {
                    const response = await fetch(endpoint, {
                        headers: header,
                        method: method,
                        body: bodyType ? JSON.stringify(body) : body,
                        signal: abortSignal
                    });

                    if (response.status == 500) {
                        // Add Alert for showing request failed with 500
                    } else if (response.status == 404) {

                    }

                    let resp = await response.json()
                    return { success: true, response: resp };
                } else {
                    // GET | DELETE Requests block
                    const response = await fetch(endpoint, {
                        headers: header,
                        method: method,
                        signal: abortSignal
                    });

                    if (response.status == 500) {
                        // Add Alert for showing request failed with 500
                    } else if (response.status == 404) {

                    }

                    let resp = await response.json()
                    return { success: true, response: resp };
                }
            } catch (error) {
                return { success: false, response: null, error: error }
            }
        },
        { retries: 5 }
    );
};