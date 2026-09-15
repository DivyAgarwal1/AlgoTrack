
fetch("https://leetcode.com/graphql", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    query: `{ userContestRanking(username: "neal_wu") { rating globalRanking attendedContestsCount } }`
  })
}).then(r => r.json()).then(console.log).catch(console.error);

