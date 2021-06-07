const DynamoDB = require("aws-sdk").DynamoDB;

const Log = require("@dazn/lambda-powertools-logger");
const commonMiddleware = require("./commonMiddleware");


const storyViewsDB = new DynamoDB.DocumentClient();
const storyViewsTableName = process.env.STORY_VIEWS_TABLE;

const upsertView = (storyId) => {
  const updatePromise = storyViewsDB
    .update({
      TableName: storyViewsTableName,
      Key: { id: storyId },
      UpdateExpression:
        "SET #views = if_not_exists(#views, :zero) + :incrementByOne",
      ExpressionAttributeValues: {
        ":incrementByOne": 1,
        ":zero": 0,
      },
      ExpressionAttributeNames: {
        "#views": "views",
      },
      ReturnValues: "ALL_NEW",
    })
    .promise();
  return updatePromise;
};

const registerView = async (event, context) => {
  Log.info("in register views...");

  const req = JSON.parse(event.body);
  const storyId = req.id;

  Log.info("upserting story views...");

  const start = Date.now();
  const storyViews = await upsertView(storyId);
  const end = Date.now();

  context.metrics.putMetric(
    "UpsertStoryViewsLatency",
    end - start,
    Unit.Milliseconds
  );

  const { id, views } = storyViews.Attributes;

  Log.info("story views updated or created...");
  Log.debug("updated or created story with views", {
    story: id,
    count: views,
  });

  const response = {
    statusCode: 200,
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ views }),
  };

  return response;
};

module.exports.handler = commonMiddleware(registerView);
