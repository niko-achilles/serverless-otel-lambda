const middy = require("@middy/core");
const sampleLogging = require("@dazn/lambda-powertools-middleware-sample-logging");
const captureCorrelationIds = require("@dazn/lambda-powertools-middleware-correlation-ids");
const logTimeout = require("@dazn/lambda-powertools-middleware-log-timeout");

const commonMiddleware = (f) => {
  return middy(f)
    .use(
      captureCorrelationIds({
        sampleDebugLogRate: parseFloat(
          process.env.SAMPLE_DEBUG_LOG_RATE || "0.01"
        ),
      })
    )
    .use(
      sampleLogging({
        sampleRate: parseFloat(process.env.SAMPLE_DEBUG_LOG_RATE || "0.01"),
      })
    )
    .use(logTimeout());
};

module.exports = commonMiddleware;
