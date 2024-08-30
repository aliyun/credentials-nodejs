import httpx from 'httpx';

export class Request {
  readonly queries: {[key: string]: string};
  readonly headers: {[key: string]: string};
  readonly method : string;
  readonly protocol: any;
  readonly host: any;
  readonly path: any;
  readonly bodyForm: { [key: string]: string; };
  readonly bodyBytes: Buffer;

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

  constructor() {
    // set default values
    this.protocol = 'https';
    this.path = '/';
    this.headers = {};
    this.queries = {};
  }

  build(): Request {
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

  withQueries(queries: {[key: string]: string }) {
    this.queries = queries;
    return this;
  }

  withHeaders(headers: {[key: string]: string }) {
    this.headers = headers;
    return this;
  }

  withBodyForm(bodyForm: {[key: string]: string}) {
    this.bodyForm = bodyForm;
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

class ResponseBuilder{
  statusCode: number;
  headers: { [key: string]: string };
  body: Buffer;

  withStatusCode(statusCode: number) {
    this.statusCode = statusCode;
    return this;
  }

  withHeaders(headers: {[key: string]: string}) {
    this.headers = headers;
    return this;
  }

  withBody(body: Buffer) {
    this.body = body;
    return this;
  }

  constructor() {

  }

  build(): Response {
    return new Response(this);
  }
}

function querystringify(queries: {[key: string]: string}) {
  const fields = [];
  for (const [key, value] of Object.entries(queries)) {
    fields.push(key + '=' + value);
  }
  return fields.join('&');
}

export async function doRequest(req: Request): Promise<Response> {
  let url = `${req.protocol}://${req.host}${req.path}`;
  if (req.queries && Object.keys(req.queries).length > 0) {
    url += `?` + querystringify(req.queries)
  }

  const response = await httpx.request(url, {
    method: req.method,
  });

  const responseBody = await httpx.read(response, '');
  return Response.builder()
    .withStatusCode(response.statusCode)
    .withHeaders(response.headers as {[key: string]: string})
    .withBody(responseBody as Buffer)
    .build();
}
