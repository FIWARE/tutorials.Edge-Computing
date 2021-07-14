exports.handler = function (contextEntity, publish, query, subscribe) {
  console.log('enter into the user-defined fog function');

  var entityID = contextEntity.entityId.id;

  if (contextEntity == null) {
    return;
  }
  if (contextEntity.attributes == null) {
    return;
  }

  var updateEntity = {};
  updateEntity.entityId = {
    id: 'Stream.result.' + entityID,
    type: 'result',
    isPattern: false
  };
  updateEntity.attributes = {};
  updateEntity.attributes.city = {
    type: 'string',
    value: 'Heidelberg'
  };

  updateEntity.metadata = {};
  updateEntity.metadata.location = {
    type: 'point',
    value: {
      latitude: 33.0,
      longitude: -1.0
    }
  };

  console.log('publish: ', updateEntity);
  publish(updateEntity);
};
