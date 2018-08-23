
exports.up = function(knex, Promise) {
  return knex.schema.createTable('beaches', function (table) {
    table.increments();
    table.string('name');
    table.decimal('longitude');
    table.decimal('latitude');
    table.json('stormglass');
    table.timestamps();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('beaches');
};
