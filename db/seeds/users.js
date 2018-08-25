exports.seed = function(knex, Promise) {
  return knex('users').del()
    .then(function () {
      return Promise.all([
        knex('users').insert({first_name: 'Alice', last_name: 'Smith', password: 'abcdef', email: 'alice@gmail.com', phone_number: '1234567'}),
        knex('users').insert({first_name: 'Bob', last_name: 'Jones', password: 'abcdef', email: 'bob@gmail.com', phone_number: '2234367'}),
        knex('users').insert({first_name: 'Charlie', last_name: 'Harris', password: 'abcdef', email: 'charlie@gmail.com', phone_number: '3334567'})
      ]);
    });
};

