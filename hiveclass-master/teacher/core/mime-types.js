// Represents plain text
exports.TEXT_PLAIN = "text/plain";

// Represents a the full string content of a montage template
// Value is the content of a template, suitable for creating an HTML5 document
exports.TEMPLATE = "x-filament/x-montage-template";

// Represents the serialization fragment for a single templateObject
// devoid of the associated markup, even if the serialization itself is for
// a component that should have an element; it's up for the recipient
// of this data to figure out that part
exports.SERIALIZATION_FRAGMENT = "x-filament/x-montage-serialization-fragment";

// Represents a new HTML element
// Value is an HTML element in string format
exports.HTML_ELEMENT = "x-filament/x-html-element";

// Represents an element in the template with a data-montage-id
// Value is a string of the data-montage-id
exports.MONTAGE_TEMPLATE_ELEMENT = "x-filament/x-montage-template-element";

// Represents an element in the template without a data-montage-id
// Value is an XPath expression
exports.MONTAGE_TEMPLATE_XPATH = "x-filament/x-montage-template-xpath";

// Represents a label for an object in the serialization
// This can be used for e.g. to create a serialization reference
// ({"@": "label"}) or binding reference ("@label")
// Value is the label
exports.SERIALIZATION_OBJECT_LABEL = "x-filament/x-montage-serialization-object-reference";

// Represents an event dispatched from a specific object
// Value is an object with targetLabel and eventType properties
exports.MONTAGE_EVENT_TARGET = "x-filament/x-montage-event-target";

// Represents a binding 
// Value is an object with targetPath, oneway, sourcePath and converterLabel properties
exports.MONTAGE_BINDING = "x-filament/x-montage-binding";

// Represents a listener 
// Value is an object with type, useCapture, listenerLabel and methodName properties
exports.MONTAGE_LISTENER = "x-filament/x-montage-listener";

// Represents an node 
// Value is an HTML node element in a json simple format
exports.JSON_NODE = "x-filament/x-montage-json-node";

// Represents a url
exports.URL = "text/x-url";
