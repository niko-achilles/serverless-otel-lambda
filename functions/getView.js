const DynamoDB = require("aws-sdk").DynamoDB;

const Log = require("@dazn/lambda-powertools-logger");
const commonMiddleware = require("./commonMiddleware");

const storyViewsDB = new DynamoDB.DocumentClient();
const storyViewsTableName = process.env.STORY_VIEWS_TABLE;

const queryViews = (storyId) => {
  const queryPromise = storyViewsDB
    .get({
      TableName: storyViewsTableName,
      Key: { id: storyId },
    })
    .promise();

  return queryPromise;
};

const getView = async (event, context) => {
  const { id } = event.pathParameters;

  Log.info("fetching story views...");


  const storyViews = await queryViews(id);


  Log.info("story views fetched...");
  Log.debug("received story with views", {
    story: id,
    count: storyViews.Item?.views,
  });

  const response = {
    statusCode: 200,
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ views: storyViews.Item?.views }),
  };

  return response;
};

module.exports.handler = commonMiddleware(getView);
