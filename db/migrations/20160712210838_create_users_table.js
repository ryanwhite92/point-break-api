exports.up = function(knex, Promise) {
  return knex.schema.createTable('users', function (table) {
    table.increments();
    table.string('first_name');
    table.string('last_name');
    table.text('password');
    table.string('email');
    table.string('phone_number');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('users');
};
