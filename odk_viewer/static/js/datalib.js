var AjaxLoader, DataManager, Field, Loader, Manager, MemoryLoader, Reader, SchemaManager, constants, fh_assert,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

constants = {
  NAME: "name",
  LABEL: "label",
  TYPE: "type",
  CHILDREN: "children",
  GROUP: "group",
  HINT: "hint",
  GEOPOINT: "geopoint",
  TEXT: "text",
  INTEGER: "integer",
  DECIMAL: "decimal",
  SELECT_ONE: "select one",
  SELECT_MULTIPLE: "select multiple",
  ID: "_id",
  START: "start",
  LIMIT: "limit",
  COUNT: "count",
  FIELDS: "fields",
  GEOLOCATION: "_geolocation"
};

fh_assert = function(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
};

Reader = (function() {

  function Reader() {}

  Reader.prototype.read = function(data) {
    return data;
  };

  return Reader;

})();

Loader = (function() {

  function Loader(_reader) {
    this._reader = _reader;
    fh_assert(typeof this._reader !== "undefined" && this._reader !== null);
  }

  return Loader;

})();

MemoryLoader = (function(_super) {

  __extends(MemoryLoader, _super);

  function MemoryLoader(_reader, _data) {
    this._data = _data;
    MemoryLoader.__super__.constructor.call(this, _reader);
  }

  MemoryLoader.prototype.load = function() {
    var deferred, parsed_data;
    deferred = $.Deferred();
    if (typeof this._data !== "undefined" && this._data !== null) {
      parsed_data = this._reader.read(this._data);
      deferred.resolve(parsed_data);
    } else {
      deferred.reject({
        "error": "No data available."
      });
    }
    return deferred.promise();
  };

  return MemoryLoader;

})(Loader);

AjaxLoader = (function(_super) {

  __extends(AjaxLoader, _super);

  function AjaxLoader(_reader, _url, _params) {
    this._url = _url;
    this._params = _params;
    AjaxLoader.__super__.constructor.call(this, _reader);
  }

  AjaxLoader.prototype.load = function() {
    var deferred, promise,
      _this = this;
    deferred = $.Deferred();
    promise = $.get(this._url, this._params);
    promise.done(function(data) {
      var parsed_data;
      parsed_data = _this._reader.read(data);
      return deferred.resolve(parsed_data);
    });
    promise.fail(function(e) {
      return deferred.reject(e);
    });
    return deferred.promise();
  };

  return AjaxLoader;

})(Loader);

Field = (function() {

  function Field(fieldDef) {
    var _this = this;
    this._name = fieldDef.name;
    this._type = fieldDef.type;
    this._hint = fieldDef.hasOwnProperty(constants.HINT) ? fieldDef.hint : null;
    this._label = fieldDef.hasOwnProperty(constants.LABEL) ? fieldDef.label : null;
    this._options = [];
    if (fieldDef.hasOwnProperty(constants.CHILDREN)) {
      _.each(fieldDef.children, function(val, key, list) {
        return _this._options.push(new Field(val));
      });
    }
  }

  Field.prototype.name = function() {
    return this._name;
  };

  Field.prototype.type = function() {
    return this._type;
  };

  Field.prototype.hint = function() {
    return this._hint;
  };

  Field.prototype.label = function(language) {
    if (typeof language !== "undefined" && language !== null) {
      return this._label[language];
    } else {
      if (typeof this._label === "object") {
        return _.values(this._label)[0];
      } else {
        return this._label;
      }
    }
  };

  Field.prototype.options = function() {
    return this._options;
  };

  return Field;

})();

Manager = (function() {

  function Manager() {}

  Manager.prototype.init = function(_loader) {
    var promise,
      _this = this;
    this._loader = _loader;
    promise = this._loader.load();
    promise.done(function(data) {
      return _this.onload(data);
    });
    promise.fail(function(e) {
      return _this.onfail(e);
    });
    return promise;
  };

  Manager.prototype.onload = function(data) {};

  Manager.prototype.onfail = function(e) {};

  return Manager;

})();

SchemaManager = (function(_super) {

  __extends(SchemaManager, _super);

  function SchemaManager() {
    this._fields = [];
    this._properties = {};
    this._supportedLanguages = [];
  }

  SchemaManager.prototype._parseLanguages = function(fieldsDef) {
    var field, label;
    field = _.find(fieldsDef, function(field) {
      return field.hasOwnProperty(constants.LABEL);
    });
    label = field.label;
    return this._supportedLanguages = typeof label === "object" ? _.keys(label) : ["default"];
  };

  SchemaManager.prototype._parseFields = function(fieldsDef) {
    var _this = this;
    return _.each(fieldsDef, function(val, key, list) {
      if (fieldsDef.type !== constants.GROUP) {
        return _this._fields.push(new Field(val));
      } else if (fieldsDef.type === constants.GROUP && fieldsDef.hasOwnProperty(constants.CHILDREN)) {
        return _this._parseFields(fieldsDef.children);
      }
    });
  };

  SchemaManager.prototype._parseSchema = function(schemaDef) {
    var _this = this;
    return _.each(schemaDef, function(val, key, list) {
      if (key !== constants.CHILDREN) {
        return _this._properties[key] = val;
      } else {
        _this._parseLanguages(val);
        return _this._parseFields(val);
      }
    });
  };

  SchemaManager.prototype.get = function(property) {
    return this._properties[property];
  };

  SchemaManager.prototype.onload = function(data) {
    return this._parseSchema(data);
  };

  SchemaManager.prototype.getFields = function() {
    return this._fields;
  };

  SchemaManager.prototype.getFieldByName = function(name) {
    return _.find(this._fields, function(field) {
      return field.name() === name;
    });
  };

  SchemaManager.prototype.getFieldsByType = function(typeName) {
    return _.filter(this._fields, function(field) {
      return field.type() === typeName;
    });
  };

  SchemaManager.prototype.getSupportedLanguages = function() {
    return this._supportedLanguages;
  };

  return SchemaManager;

})(Manager);

DataManager = (function(_super) {

  __extends(DataManager, _super);

  DataManager.typeMap = {};

  DataManager.typeMap[constants.INTEGER] = dv.type.numeric;

  DataManager.typeMap[constants.DECIMAL] = dv.type.numeric;

  DataManager.typeMap[constants.SELECT_ONE] = dv.type.nominal;

  DataManager.typeMap[constants.TEXT] = dv.type.unknown;

  DataManager.typeMap[constants.SELECT_MULTIPLE] = dv.type.unknown;

  DataManager.typeMap[constants.ID] = dv.type.unknown;

  function DataManager(_schemaManager) {
    this._schemaManager = _schemaManager;
    this._dvTable = null;
  }

  DataManager.prototype._pushToStore = function(responses) {
    var dvData, fields,
      _this = this;
    dvData = {};
    this._dvTable = dv.table();
    fields = _.filter(this._schemaManager.getFields(), function(field) {
      if (DataManager.typeMap.hasOwnProperty(field.type())) {
        dvData[field.name()] = [];
        return true;
      }
      return false;
    });
    _.each(responses, function(response) {
      return _.each(fields, function(field) {
        return dvData[field.name()].push(response[field.name()]);
      });
    });
    return _.each(fields, function(field) {
      return _this._dvTable.addColumn(field.name(), dvData[field.name()], DataManager.typeMap[field.type()]);
    });
  };

  DataManager.prototype.onload = function(data) {
    return this._pushToStore(data);
  };

  DataManager.prototype.dvQuery = function(query) {
    return this._dvTable.query(query);
  };

  return DataManager;

})(Manager);
