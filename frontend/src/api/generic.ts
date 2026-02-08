type ApiUrlParams<B> = {
  path?: Record<string, string>;
  query?: Record<string, string | string[] | boolean | number | undefined>;
  body?: B;
};

function formatApiUrl(apiPath: string, params: ApiUrlParams<unknown>) {
  for (const key in params.path) {
    const reSlash = new RegExp(`:${key}/`);
    apiPath = apiPath.replace(reSlash, params.path[key] + "/");
    const reEnd = new RegExp(`:${key}$`);
    apiPath = apiPath.replace(reEnd, params.path[key]);
  }

  const url = new URL(apiPath, window.location.origin);

  for (const [key, value] of Object.entries(params.query ?? {})) {
    if (Array.isArray(value)) {
      for (const subValue of value) {
        if (subValue !== undefined) {
          url.searchParams.append(key, subValue.toString());
        }
      }
    } else {
      if (value !== undefined) {
        url.searchParams.append(key, value.toString());
      }
    }
  }

  return url.toString();
}

// Q = query params, O = output, P = path params
export function makeApiGet<
  Q extends
    | Record<string, string | string[] | boolean | number | undefined>
    | undefined = undefined,
  O = void,
  P extends Record<string, string> | undefined = undefined,
>(apiPath: `/${string}`) {
  return async function apiCaller(
    params: (P extends undefined ? { path?: undefined } : { path: P }) &
      (Q extends undefined ? { query?: undefined } : { query: Q }),
  ): Promise<O> {
    const url = formatApiUrl(apiPath, params);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`GET ${apiPath} failed: ${response.status}`);
    }
    return response.json();
  };
}

// B = body, O = output, P = path params
export function makeApiPost<
  B = undefined,
  O = void,
  P extends Record<string, string> | undefined = undefined,
>(apiPath: `/${string}`) {
  return async function apiCaller(
    params: (P extends undefined ? { path?: undefined } : { path: P }) &
      (B extends undefined ? { body?: undefined } : { body: B }),
  ): Promise<O> {
    const url = formatApiUrl(apiPath, params);
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params.body),
    });
    if (!response.ok) {
      throw new Error(`POST ${apiPath} failed: ${response.status}`);
    }
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as O;
  };
}
