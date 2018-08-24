exports.up = function(knex, Promise) {
  return knex.schema.createTable('favorites', function (table) {
    table.increments();
    table.integer('user_id');
    table.foreign('user_id').references('users.id');
    table.integer('beach_id');
    table.foreign('beach_id').references('beaches.id');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('favorites');
};