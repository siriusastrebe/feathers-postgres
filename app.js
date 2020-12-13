const feathers = require('@feathersjs/feathers');
const express = require('@feathersjs/express');
const socketio = require('@feathersjs/socketio');
const feathersKnex = require('feathers-knex');
const knex = require('knex')({
  client: 'pg',
  connection: {
    host: '127.0.0.1',
    user: 'sirius',
    database: 'feathers'
  }
});

const app = express(feathers());                 // Creates an ExpressJS compatible Feathers application
app.use(express.json());                         // Parse HTTP JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded params
app.use(express.static(__dirname));              // Host static files from the current folder
app.configure(express.rest());                   // Add REST API support
app.configure(socketio());                       // Configure Socket.io real-time APIs
app.use(express.errorHandler());                 // Register a nicer error handler than the default Express one

app.use('/messages', feathersKnex({
  Model: knex,
  name: 'messages'
}));

// Populate initial data
knex.schema.dropTableIfExists('messages').then(() => {
  console.log('Dropped table messages');

  return knex.schema.createTable('messages', table => {
    console.log('Creating messages table');
    table.increments('id');
    table.string('text');
  });
}).then(() => {
  app.service('messages').create({
    text: 'Message created on server'
  }).then(message => console.log('Created message', message));
});


// Real-time support
app.on('connection', connection => {
  app.channel('everybody').join(connection);
});
app.publish((data, hook) => {
  return app.channel('everybody');
});

app.listen(3030).on('listening', () =>
  console.log('Feathers server listening on localhost:3030')
);
