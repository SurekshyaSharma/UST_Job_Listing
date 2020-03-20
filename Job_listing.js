// *********************************************************************************************************************
// Global variables                                                                                                    *
// difine global variables that will be use throughout the code                                                        *
// *********************************************************************************************************************
var _csvfile = './jobsample.csv';
var _JsonData;

// Do some stuff when page hmtl page is launched
$(document).ready( function () {

    $("#headerTitle").hide(300).show(1500);

    var _USTJobFile = "https://uofstthomasmn.sharepoint.com/sites/Groupitseadstudents/Shared%20Documents/Projects/USTjobs.xls";

    // read csv file and convert to json format
    $.ajax({

        type: 'GET',

        url: './USTjobs.xls',

        dataType: 'text',

        error: function (e) {
            alert('An error occurred while processing API calls');
            console.log("API call Failed: ", e);
        },

        success: function (data) {

            // To read the excel file we use the read method in SheetJs
            var workbook = XLSX.read(data, 
                { 
                    type: 'binary', 
                    cellDates: true, 
                    cellNF: false, 
                    cellText: false 
                }
            );

            /* *****************************************************************
            *    Converting Excel value to Json                                *
            ********************************************************************/
            var first_sheet_name = workbook.SheetNames[0];
            /* Get worksheet */
            var worksheet = workbook.Sheets[first_sheet_name];    
            _JsonData = XLSX.utils.sheet_to_json(worksheet, { raw: true });
            /************************ End of conversion ************************/
           
            var jobtypes = new Array();
            var departments = new Array();
            var location = new Array();

            var types_ref = '#empType';
            var dep_ref = '#departments';
            var loc_ref = '#location';
            
       
            $.each(_JsonData, function (index, value){
               
                if (!jobtypes.includes(value['Employment Type'])){
                    jobtypes.push(value['Employment Type']);
                }

                if (!departments.includes(value['Department/Unit'])){
                    departments.push(value['Department/Unit']);
                }

                if (!location.includes(value['Campus : Location'])){
                    location.push(value['Campus : Location']);
                }
            });

            // sort drop down lists
            jobtypes.sort();
            departments.sort();
            location.sort();

            // make function calls on page loading
            fill_filter(jobtypes, types_ref);
            fill_filter(departments, dep_ref);
            fill_filter(location, loc_ref);
            displayJobs(_JsonData);

        } // end: Ajax success API call

    }); // end: of Ajax call

    var ShowJobs = $('#showjobs');

    $(".clicker").click(function () {
        var top = $(this).position().top,
            currentScroll = ShowJobs.scrollTop();

        ShowJobs.animate({
            scrollTop: currentScroll + top
        }, 1500);
    });

}); // end: document.ready()

$(document).on('change', 'select', function () {
    console.log($(this).val()); // the selected options’s value

    // if you want to do stuff based on the OPTION element:
    var opt = $(this).find('option:selected')[0];
    // use switch or if/else etc.

    // call filter display to show data
    filtered_display();
});


function displayJobs(data){
    
    // sort data by date
    // to show the most recent job posted first
    var _sortedData = data.sort(function (a, b) {
        // * - 1 : get a reverse sort
        return (new Date(b['Posting Date']) - new Date(a['Posting Date']));
    });
    var number = 0;

    $.each(_sortedData, function (index, value) {
      
        var _closingDate;

        if ((value['Closing Date']) != undefined) {

            if ($.type(value['Closing Date']) === 'string') {

                _closingDate = value['Closing Date'];
            }
            else {
                var _date = new Date(value['Closing Date']);
                var _dateString = _date.toDateString();
                _closingDate = new Date(_dateString).toLocaleString('en-US',
                    {
                        day: 'numeric',
                        weekday: 'long',
                        month: 'long',
                        year: 'numeric'
                    }
                );
            }
            
        }else{
            _closingDate = 'No Closing Date';
        }
        
        //dnt append the data when there is no url filter
       if(value['Job URL (Linked)'] != undefined){

        $('#joblist').append(

            '<div id="jobDiscription">' +
            '<a id="a" href="' + value['Job URL (Linked)'] + '" target="_blank">' +
                    '<h3>' + value['Position Title'] + '</h3>' +
                '</a>' +

                '<ul>' +
                    '<li id="li"><strong>Number of Openings:</strong> ' + value['# of Openings'] + '</li>' +
                    '<li id="li"><strong>Employment Type:</strong> ' + value['Employment Type'] + '</li>' +
                    '<li id="li"><strong>Department/Unit:</strong> ' + value['Department/Unit'] + '</li>' +
                    '<li id="li"><strong>Campus | Location:</strong> ' + value['Campus : Location'] + '</li>' +
                    '<li id="li"><strong>Who May Apply:</strong> ' + value['Who May Apply'] + '</li>' +
                    '<li id="li"><strong>Closing Date:</strong> ' + _closingDate + '</li>' +
                '</ul>' +
            '</div>'

        );
        number += 1;
        }
    
    }); // end: loop sorted data
            if(number == 0){
                 $('#joblist').append(

                    '<div class="my-notify-info">' + 
                        " The job that you were looking for either does not exist or is no longer open." +
                    '</div>'
                );
            }
}

function fill_filter(filters, filter_ref){
    $.each(filters, function (index, value){
        $(filter_ref).append('<option value="'+value+'">'+value+'</option>');
    });
}

function filtered_display(){

    $('#joblist').empty();

    var type = document.getElementById("empType").value;
    var dep = document.getElementById("departments").value;
    var loc = document.getElementById("location").value;

    var filtersConsidered = new Map(
        [
            ["Employment Type", type], 
            ["Department/Unit", dep], 
            ["Campus : Location", loc]
        ]
    );

    var filterresults = new Array();

    for (let [k, v] of filtersConsidered) {
        if (v == ""){
            filtersConsidered.delete(k);
        }
    }

    $.each(_JsonData, function (index, value){
        
        var count = 0;
        for (let [k, v] of filtersConsidered) {
            if (value[k] == v){
                count++;
            }
        }
        if (count == filtersConsidered.size) {
            filterresults.push(value);
    
        }
    });

    if (filterresults.length != 0){
        displayJobs(filterresults);
    }else{
        $('#joblist').append(

            '<div class="my-notify-info">' + 
                "Your search doesn't match any job listed at University of St. Thomas.<br>" +
                'Please clear search and try again!' +
            '</div>'
        );
    } 
}

function search(e){
    e.preventDefault();
    
    $('#joblist').empty();
    var textInput = document.getElementById("searchInput").value;
    var userInput = textInput.toLowerCase();
    var number = 0;
    
    $.each(_JsonData, function (index, value){
  
        var locationFix = value['Campus : Location'].split('-');
        var loc=locationFix .pop().toLowerCase();
        var LocDot = loc.split('.').join("");
  
        var _closingDate;
       

        if ((value['Closing Date']) != undefined) {

            if ($.type(value['Closing Date']) === 'string') {

                _closingDate = value['Closing Date'];
            }
            else {
                var _date = new Date(value['Closing Date']);
                var _dateString = _date.toDateString();
                _closingDate = new Date(_dateString).toLocaleString('en-US',
                    {
                        day: 'numeric',
                        weekday: 'long',
                        month: 'long',
                        year: 'numeric'
                    }
                );
            }
            
        }else{
            _closingDate = 'No Closing Date';

        }
        
        var lowercasePosiType =  value['Position Title'].toLowerCase();
        var lowercaseEmpType =  value['Employment Type'].toLowerCase();
        var lowercaseLocType =  LocDot.toLowerCase();
       
        match = 0;
       //searching on the basis of location, faculty and employement type
        if(lowercasePosiType.includes(userInput)){
            match = 1;
        }
        if(lowercaseEmpType.includes(userInput)){
            match = 1;
           
        }
        if(lowercaseLocType.includes(userInput)){
            match = 1;
           
        }

        if (match ==1 && value['Job URL (Linked)'] != undefined ){
          
             $('#joblist').append(

                '<div id="jobDiscription">' +
                '<a id="a" href="' + value['Job URL (Linked)'] + '" target="_blank">' +
                        '<h3>' + value['Position Title'] + '</h3>' +
                '</a>' +
    
                    '<ul>' +
                        '<li id="li"><strong>Number of Opennings:</strong> ' + value['# of Openings'] + '</li>' +
                        '<li id="li"><strong>Employment Type:</strong> ' + value['Employment Type'] + '</li>' +
                        '<li id="li"><strong>Department/Unit:</strong> ' + value['Department/Unit'] + '</li>' +
                        '<li id="li"><strong>Campus | Location:</strong> ' + value['Campus : Location'] + '</li>' +
                        '<li id="li"><strong>Who May Apply:</strong> ' + value['Who May Apply'] + '</li>' +
                         '<li id="li"><strong>Closing Date:</strong> ' + _closingDate + '</li>' +
                    '</ul>' +
                '</div>'
            );
            number += 1;
          } 
    });
            if(number == 0)
            {
                $('#joblist').append(

                    '<div class="my-notify-info">' + 
                        "The job that you were looking for either does not exist or is no longer open." +
                    '</div>'
                );
            }

}

function clear_filter(){
    $('#joblist').empty();
    displayJobs(_JsonData);

    $('#empType').val("");
    $('#departments').val("");
    $('#location').val("");
    $('#searchInput').val("");
   
}
