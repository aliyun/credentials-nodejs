import httpx from 'httpx';

export class Request {
  readonly queries: { [key: string]: string };
  readonly headers: { [key: string]: string };
  readonly method: string;
  readonly protocol: any;
  readonly host: any;
  readonly path: any;
  readonly bodyForm: { [key: string]: string; };
  readonly bodyBytes: Buffer;
  readonly url: string;
  readonly readTimeout: number;
  readonly connectTimeout: number;

  static builder() {
    return new RequestBuilder();
  }

  constructor(builder: RequestBuilder) {
    this.method = builder.method;
    this.protocol = builder.protocol;
    this.host = builder.host;
    this.path = builder.path;
    this.queries = builder.queries;
    this.headers = builder.headers;
    this.bodyForm = builder.bodyForm;
    this.bodyBytes = builder.bodyBytes;
    this.url = builder.url;
    this.readTimeout = builder.readTimeout;
    this.connectTimeout = builder.connectTimeout;
  }

  toRequestURL(): string {
    if(this.url){
      return this.url;
    }
    let url = `${this.protocol}://${this.host}${this.path}`;
    if (this.queries && Object.keys(this.queries).length > 0) {
      url += `?` + querystringify(this.queries)
    }
    return url;
  }
}

export class RequestBuilder {
  method: string;
  protocol: string;
  host: string;
  path: string;
  queries: { [key: string]: string; };
  headers: { [key: string]: string; };
  bodyForm: { [key: string]: string; };
  bodyBytes: Buffer;
  readTimeout: number;
  connectTimeout: number;
  url: string;

  build(): Request {
    // set default values
    if (!this.protocol) {
      this.protocol = 'https';
    }

    if (!this.path) {
      this.path = '/';
    }

    if (!this.headers) {
      this.headers = {};
    }

    if (!this.queries) {
      this.queries = {};
    }

    return new Request(this);
  }

  withMethod(method: string) {
    this.method = method;
    return this;
  }

  withProtocol(protocol: string): this {
    this.protocol = protocol;
    return this;
  }

  withHost(host: string): this {
    this.host = host;
    return this;
  }

  withPath(path: string) {
    this.path = path;
    return this;
  }

  withQueries(queries: { [key: string]: string }) {
    this.queries = queries;
    return this;
  }

  withHeaders(headers: { [key: string]: string }) {
    this.headers = headers;
    return this;
  }

  withBodyForm(bodyForm: { [key: string]: string }) {
    this.bodyForm = bodyForm;
    return this;
  }

  withURL(url: string){
    this.url = url;
    return this;
  }

  withReadTimeout(readTimeout: number) {
    this.readTimeout = readTimeout;
    return this;
  }

  withConnectTimeout(connectTimeout: number) {
    this.connectTimeout = connectTimeout;
    return this;
  }
}

export class Response {
  readonly statusCode: number;
  readonly body: Buffer;
  readonly headers: { [key: string]: string };

  static builder() {
    return new ResponseBuilder();
  }

  constructor(builder: ResponseBuilder) {
    this.statusCode = builder.statusCode;
    this.headers = builder.headers;
    this.body = builder.body;
  }
}

class ResponseBuilder {
  statusCode: number;
  headers: { [key: string]: string };
  body: Buffer;

  withStatusCode(statusCode: number) {
    this.statusCode = statusCode;
    return this;
  }

  withHeaders(headers: { [key: string]: string }) {
    this.headers = headers;
    return this;
  }

  withBody(body: Buffer) {
    this.body = body;
    return this;
  }

  constructor() {
    this.headers = {};
  }

  build(): Response {
    return new Response(this);
  }
}

function querystringify(queries: { [key: string]: string }) {
  const fields = [];
  for (const [key, value] of Object.entries(queries)) {
    fields.push(key + '=' + encodeURIComponent(value));
  }
  return fields.join('&');
}

export async function doRequest(req: Request): Promise<Response> {
  const url = req.toRequestURL();

  let body;
  if (req.bodyForm && Object.keys(req.bodyForm).length > 0) {
    body = querystringify(req.bodyForm);
    if (!req.headers['Content-Type']) {
      req.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }
  }

  const response = await httpx.request(url, {
    method: req.method,
    data: body,
    headers: req.headers,
    readTimeout: req.readTimeout,
    connectTimeout: req.connectTimeout
  });

  const responseBody = await httpx.read(response, '');
  return Response.builder()
    .withStatusCode(response.statusCode)
    .withHeaders(response.headers as { [key: string]: string })
    .withBody(responseBody as Buffer)
    .build();
}
