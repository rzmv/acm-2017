/*
 * MISIS ACM SYSTEM
 * https://github.com/IPRIT
 *
 * Copyright (c) 2017 "IPRIT" Alex Belov, contributors
 * Licensed under the BSD license.
 * Created on 16.02.2017
 */

import crypto from 'crypto';

let io,
  hashSalt = 'misis_acm_belov_2017',
  initializedAtMs;

export function initialize(s_io) {
  io = s_io;
  initializedAtMs = Date.now();
}

export function getInstance() {
  return io;
}

export function subscribeEvents(socket) {
  console.info(`[${socket.id}] connected to the server.`, );
  
  socket.emit('server started', {
    socketId: socket.id,
    startedAt: initializedAtMs
  });
  
  socket.on('contest.join', data => {
    let { contestId, userId } = data;
    if (!contestId || !userId) {
      return;
    }
    console.info(`[${userId}:${socket.id}] joined the contest: ${contestId}.`);
    let contestHashKey = getContestHashKey(contestId);
    let userHashKey = getUserHashKey([ contestId, userId ].join('_'));
    socket.join(contestHashKey);
    socket.join(userHashKey);
  });
  
  socket.on('contest.left', data => {
    let { contestId, userId } = data;
    if (!contestId || !userId) {
      return;
    }
    console.info(`[${userId}:${socket.id}] left the contest: ${contestId}.`);
    let contestHashKey = getContestHashKey(contestId);
    let userHashKey = getUserHashKey([ contestId, userId ].join('_'));
    socket.leave(contestHashKey);
    socket.leave(userHashKey);
  });
  
  socket.on('disconnect', function (data) {
    console.log(`[${socket.id}] disconnected from the server.`, );
  });
}

function getContestHashKey(str) {
  return crypto.createHash('md5').update('contest' + str + hashSalt).digest('hex');
}

function getUserHashKey(str) {
  return crypto.createHash('md5').update('user' + str + hashSalt).digest('hex');
}

export function emitNewSolutionEvent(params = {}, target = 'contest') {
  let eventName = 'new solution';
  if (target === 'contest') {
    let { contestId, solution } = params;
    emitContestEvent(contestId, eventName, solution);
  } else if (target === 'user') {
    let { contestId, userId, solution } = params;
    emitUserEvent(contestId, userId, eventName, solution);
  }
}

export function emitTableUpdateEvent(params = {}, target = 'contest') {
  let eventName = 'table update';
  if (target === 'contest') {
    let { contestId } = params;
    emitContestEvent(contestId, eventName, {});
  } else if (target === 'user') {
    let { contestId, userId } = params;
    emitUserEvent(contestId, userId, eventName, {});
  }
}

export function emitVerdictUpdateEvent(params = {}, target = 'contest') {
  let eventName = 'verdict updated';
  if (target === 'contest') {
    let { contestId, solution } = params;
    emitContestEvent(contestId, eventName, solution);
  } else if (target === 'user') {
    let { contestId, userId, solution } = params;
    emitUserEvent(contestId, userId, eventName, solution);
  }
}

export function emitNewMessageEvent(params = {}, target = 'contest') {
  let eventName = 'new message';
  if (target === 'contest') {
    let { contestId, message } = params;
    emitContestEvent(contestId, eventName, message);
  } else if (target === 'user') {
    let { contestId, userId, message } = params;
    emitUserEvent(contestId, userId, eventName, message);
  }
}

export function emitResetSolutionEvent(params = {}, target = 'contest') {
  let eventName = 'reset solution';
  if (target === 'contest') {
    let { contestId, solutionId } = params;
    emitContestEvent(contestId, eventName, { solutionId });
  } else if (target === 'user') {
    let { contestId, userId, solutionId } = params;
    emitUserEvent(contestId, userId, eventName, { solutionId });
  }
}

function emitContestEvent(contestId, eventName, data = {}) {
  let contestHashKey = getContestHashKey(contestId);
  console.info(`Emitting socket.io contest's event: ${eventName}:${contestId}`);
  io.to(contestHashKey).emit(eventName, data);
}

function emitUserEvent(contestId, userId, eventName, data = {}) {
  let userHashKey = getUserHashKey([ contestId, userId ].join('_'));
  console.info(`Emitting socket.io user's event: ${eventName}:${contestId}_${userId}`);
  io.to(userHashKey).emit(eventName, data);
}