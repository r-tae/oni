const { Octokit } = require("octokit");
const { getLogger } = require("../services");
const log = getLogger();
const { filter } = require('lodash');

async function getGroupMembership(user, org) {
  try {
    const octokit = new Octokit({ auth: user.accessToken });
    const res = await octokit.request('GET /user/memberships/orgs/{org}', {
      org: org
    })
    console.log("Hello, %s", res.data);
    return res.data;
  } catch (e) {
    console.log(e);
    return { error: e }
  }
}

async function getGroupsMembership({ user, org }) {
  try {
    const octokit = new Octokit({ auth: user.accessToken });
    const res = await octokit.request('GET /user/orgs', {
      org: org
    });
    //TODO: check if result is paginated
    console.log("Hello, %s", res.data);
    return res.data;
  } catch (e) {
    console.log(e);
    return { error: e }
  }
}

async function getTeamsMembership(user, org, team) {
  try {
    const octokit = new Octokit({ auth: user.accessToken });
    const res = await octokit.request('GET /orgs/{org}/teams/{team_slug}/memberships/{username}', {
      org: org,
      team_slug: team,
      username: user.username
    })
    console.log("Hello, %s", res.data);
    return res.data;
  } catch (e) {
    console.log(e);
    return { error: e }
  }
}

async function getTeamMembership({ user, group }) {

  // Group is not used right now, because the app can only handle its own groups.

  const octokit = new Octokit({ username: user.username, auth: user.accessToken });
  const data = { teams: [], error: null };
  try {
    const res = await octokit.request('GET /user/teams', {
      org: group,
      per_page: 100
    });

    //TODO: It may have pagination!
    if (Array.isArray(res.data)) {
      res.data.forEach(function (t) {
        data.teams.push({ team: t });
      });
    }
  } catch (e) {
    data['error'] = e;
  }
  return data;

}

async function getGithubUser({ user }) {
  try {
    const octokit = new Octokit({ auth: user.accessToken });
    const res = await octokit.request('GET /user');
    //TODO: check if result is paginated
    log.debug("Hello, %s", res.data['login']);
    return res.data;
  } catch (e) {
    log.error(e);
    return { error: e }
  }
}

async function getGithubToken({ authGithub, code, verifier }) {
  //Github Auth Flow: https://github.com/github/developer.github.com/blob/master/content/v3/oauth.md

  const response = await fetch(`${ authGithub['discover'] }/login/oauth/access_token`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: authGithub['clientID'],
      client_secret: authGithub['clientSecret'],
      redirect_uri: authGithub['redirectUri'],
      code: code,
      state: verifier
    })
  });
  const token = await response.json();
  return token;
}

function filterMembeshipsByGroup({ teamMembership, group }) {
  //TODO: what if you have multiple groups
  const teams = [];
  for (const { team } of teamMembership['teams']) {
    if (team['organization']['login'] === group) {
      teams.push({ group: team['slug'], description: team['description'] });
    }
  }
  return teams;
}

module.exports = {
  getGithubToken,
  filterMembeshipsByGroup,
  getGroupMembership,
  getGroupsMembership,
  getTeamsMembership,
  getTeamMembership,
  getGithubUser
}