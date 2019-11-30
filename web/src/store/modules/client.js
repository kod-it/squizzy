import client from '../../sanityClient'
import router from '../../router'
import axios from 'axios'

// Query to get all info about a match
const query = `
  *[_type == "match" && slug.current  == $slug][0]{
    "title": quiz->title,
    "slug": slug.current,
    "questions": quiz->questions,
    "players": players[]->{name, _id},
    startedAt,
    finishedAt,
    answers
  }
`
// Query to listen for new match updates
const listenerQuery = `*[_type == "match" && slug.current == $slug]`

// Variable for listener to subscribe and unsubscribe
let subscription

const state = {
  isListening: false // boolean
}

const mutations = {
  SET_IS_LISTENING(state, status) {
    state.isListening = status
  }
}

const actions = {
  // Get the match to play
  getMatchDetails({dispatch}, slug) {
    dispatch('quiz/resetAll', null, {root: true})
    return client
      .fetch(query, {slug})
      .then(match => {
        // Start the listener to get latest match updates
        dispatch('startListener', match.slug)
        // Set the match details
        dispatch(
          'quiz/getMatchDetails',
          {
            title: match.title,
            slug: match.slug
          },
          {root: true}
        )
        // Set players
        dispatch('quiz/getPlayers', match.players, {root: true})
        // Set questions for this match
        dispatch('quiz/getQuestions', match.questions, {root: true})
        // Return resolved promise to resolve beforeEnter route on /match/:id
        return Promise.resolve(true)
      })
      .catch(e => {
        console.error(e)
        return Promise.resolve(false)
      })
  },
  startListener({commit, dispatch}, slug) {
    commit('SET_IS_LISTENING', true)
    const params = {slug}
    subscription = client.listen(listenerQuery, params).subscribe(update => {
      dispatch('updateQuiz', update.result)
    })
  },
  stopListener({commit}) {
    commit('SET_IS_LISTENING', false)
    subscription.unsubscribe()
  },
  updateQuiz({dispatch}, match) {
    // Update quiz/isOngoing
    const isOngoing = match.startedAt && !match.finishedAt
    dispatch('quiz/getIsOngoing', isOngoing, {root: true})

    // Update player/players array
    dispatch('quiz/getPlayers', match.players, {root: true})

    // Update quiz/isQuestionOpen
    dispatch('quiz/getIsCurrentQuestionOpen', match.isCurrentQuestionOpen, {root: true})

    // Get the current question key
    if (match.isCurrentQuestionOpen) {
      dispatch('quiz/getCurrentQuestionKey', match.currentQuestionKey, {root: true})
    } else {
      dispatch('quiz/getCurrentQuestionKey', null, {root: true})
    }

    if (router.currentRoute.name !== 'quiz' && match.isCurrentQuestionOpen) {
      router.push({name: 'quiz'})
    }
  },
  // eslint-disable-next-line no-empty-pattern
  submitAnswer({rootState}, key) {
    const url = 'https://squizzy-server.sanity-io.now.sh/api/submit-answer'
    const answer = {
      playerId: rootState.player.player.id,
      matchSlug: rootState.quiz.match.slug,
      questionKey: rootState.quiz.currentQuestionKey,
      selectedChoiceKey: key
    }
    return axios
      .post(url, answer)
      .then(result => {
        console.log(result)
      })
      .catch(error => {
        console.log(error)
      })
  }
}

export default {
  namespaced: true,
  state,
  actions,
  mutations
}