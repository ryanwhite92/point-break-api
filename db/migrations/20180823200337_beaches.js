
exports.up = function(knex, Promise) {
  return knex.schema.createTable('beaches', function (table) {
    table.increments();
    table.string('name');
    table.decimal('longitude');
    table.decimal('latitude');
    table.json('stormglass');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('beaches');
};
