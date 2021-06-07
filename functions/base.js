const commonMiddleware = require("./commonMiddleware");
const cors = require("@middy/http-cors");

const axios = require("axios").default;
const Log = require("@dazn/lambda-powertools-logger");
const CorrelationIds = require("@dazn/lambda-powertools-correlation-ids");

const storyViewsGETApi = process.env.STORY_VIEWS_GET_API;
const storyViewsPOSTApi = process.env.STORY_VIEWS_POST_API;

const registerStoryView = async (storyId) => {
  const url = new URL(storyViewsPOSTApi);
  let request = {
    host: url.hostname,
    path: url.pathname,
    method: "POST",
    headers: { "content-type": "application/json", ...CorrelationIds.get() },
    data: { id: storyId },
    url: storyViewsPOSTApi,
  };

  Log.info("registering views...");

  const resp = await axios(request);

  Log.info("views registered...");
  return resp.data;
};

const fetchStoryViews = async (storyId) => {
  const url = new URL(`${storyViewsGETApi}/${storyId}`, storyViewsGETApi);
  let request = {
    host: url.hostname,
    path: url.pathname,
    method: "GET",
    url: `${storyViewsGETApi}/${storyId}`,
    headers: {
      ...CorrelationIds.get(),
    },
  };

  Log.info("fetching views...");
  const resp = await axios(request);
  Log.info("views fetched...");
  return resp.data;
};

const base = async (event, context) => {
  let response;
  const { storyId } = event.queryStringParameters;

  if (event.httpMethod === "GET") {
    const storyViews = await fetchStoryViews(storyId);
    response = {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(storyViews),
    };
  }

  if (event.httpMethod === "POST") {
    const storyViews = await registerStoryView(storyId);
    response = {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(storyViews),
    };
  }

  return response;
};

module.exports.handler = commonMiddleware(base).use(cors());
