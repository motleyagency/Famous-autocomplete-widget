Famous Autocomplete Widget
==========================

An autocomplete input field that works with Famo.us. Wraps an InputSurface and provides selectable
options after the user starts typing. 

Optimized for touch devices, not ready for the mouse-driven web (yet). 


== Usage
    
    // Your basic Famo.us setup
    var mainContext = Engine.createContext();

    // Create the new field
    var ai = new AutocompleteInput({
        placeholder: 'Favorite musician'
    });
    
    // Add it to Famo.us main context
    mainContext.add(ai);
    
    ai.addOption("Nikki Sixx");
    ai.addOption("Tommy Lee");
    ai.addOption("Mick Mars");
    ai.addOption("Vince Neil");
    ai.addOption("John Corabi");
    ai.addOption("Randy Castillo");
    ai.addOption("Samantha Maloney");
    
    // Use val() to get the value
    ai.on('selected', function(value) {
        console.log('selected', value);
    });
    
    