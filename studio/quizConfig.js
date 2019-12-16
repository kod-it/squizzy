export default {
  localWebHost: 'http://localhost:8080', // default Vue port
  localApiHost: 'http://localhost:3000', // default Now API port
  match: {
    correctAnswerScore: 100,
    firstAnswerScore: 50,
  },
  schema: {
    maxAnswerLength: 50,
    maxQuestionLength: 100,
    maxNumberOfChoices: 4,
    minNumberOfChoices: 2,
    defaultTimeLimit: 30,
  },
}