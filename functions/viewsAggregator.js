const DynamoDB = require("aws-sdk").DynamoDB;

const Log = require("@dazn/lambda-powertools-logger");
const commonMiddleware = require("./commonMiddleware");

const storyViewsDB = new DynamoDB.DocumentClient();
const storyViewsTableName = process.env.STORY_VIEWS_TABLE;

const updateAllViews = (allViews) => {
  const updatePromise = storyViewsDB
    .update({
      TableName: storyViewsTableName,
      Key: { id: "all" },
      UpdateExpression: "SET #views = :allViews",
      ExpressionAttributeValues: {
        ":allViews": allViews,
      },
      ExpressionAttributeNames: {
        "#views": "views",
      },
      ReturnValues: "UPDATED_NEW",
    })
    .promise();
  return updatePromise;
};

const scanStories = (storyId) => {
  const scanPromise = storyViewsDB
    .scan({
      TableName: storyViewsTableName,
      FilterExpression: "NOT id = :val AND NOT id = :all",
      ExpressionAttributeValues: {
        ":val": storyId,
        ":all": "all",
      },
    })
    .promise();
  return scanPromise;
};

const viewsAggregator = async (event, context) => {
  Log.info("received records", {
    length: event.Records.length,
  });

  const eventName = event.Records[0].eventName;
  Log.info("event name of record", { name: eventName });

  if (eventName !== "MODIFY") {
    return;
  }

  const record = event.Records[0].dynamodb;
  Log.info("processing record", {
    record: event.Records[0].dynamodb,
  });

  const id = record.NewImage.id.S;
  if (record.NewImage.id.S === "all") return;

  const scannedStories = await scanStories(id);

  Log.info("scanned stories", { stories: scannedStories });

  let sum = 0;
  scannedStories.Items.forEach((item) => {
    sum += item.views;
  });
  Log.info("calculated sum", { sum: sum });

  const allViews = parseInt(record.NewImage.views.N) + sum;
  Log.info("calculated allViews", { allViews: allViews });

  const updateAllViewsResult = await updateAllViews(allViews);
  Log.info("updated allViews", { result: updateAllViewsResult });

  return {
    status: "ok",
  };
};

module.exports.handler = commonMiddleware(viewsAggregator);
