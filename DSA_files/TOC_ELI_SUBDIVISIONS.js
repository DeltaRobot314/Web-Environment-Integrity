const eliSubdivisions = ['ACT', 'AGR', 'ALN', 'ANX', 'APP', 'ART', 'CGR', 'CIT',
  'CLS',
  'CNV',
  'COL',
  'COR',
  'CPT',
  'DCL',
  'DES',
  'ENC',
  'END',
  'EXL',
  'FGR',
  'FNA',
  'FNP',
  'FTN',
  'IDT',
  'IMG',
  'INP',
  'LGD',
  'LLG',
  'LST',
  'LTR',
  'MNT',
  'NOT',
  'OTH',
  'PAG',
  'PAR',
  'PBL',
  'PCD',
  'PNT',
  'PRO',
  'PRT',
  'PTA',
  'PTI',
  'RCT',
  'ROW',
  'RUL',
  'SBS',
  'SCT',
  'SFR',
  'SNT',
  'SUB',
  'TAB',
  'TBG',
  'TIS',
  'TIT',
  'TOC',
  'TXN',
  'TXO',
  'UNP',
  'WRP'
];


//Filters by type of document
const filtersByTypeOfDocument = new Map([
  ['CONSLEG', []],
  ['OJ', []]
]);

//CSS Styles by type of document
const stylesByTypeOfDocument = new Map([
  ['CONSLEG', new Map([
    ['enc', ['bold']],
    ['art', ['bold']],
    ['cpt', ['italic']],
    ['prt', ['italic']],
    ['tis', ['italic']],
    ['agr', ['bold']],
    ['anx', ['bold']],
    ['cnv', ['bold']],
    ['dcl', ['bold']],
    ['exl', ['bold']],
    ['exl', ['bold']],
    ['fna', ['bold']],
    ['ltr', ['bold']],
    ['mnt', ['bold']],
    ['pro', ['bold']]
  ])],
  ['OJ', new Map([
    ['enc', ['bold']],
    ['art', ['bold']],
    ['cpt', ['italic']],
    ['prt', ['italic']],
    ['tis', ['italic']],
    ['agr', ['bold']],
    ['anx', ['bold']],
    ['cnv', ['bold']],
    ['dcl', ['bold']],
    ['exl', ['bold']],
    ['exl', ['bold']],
    ['fna', ['bold']],
    ['ltr', ['bold']],
    ['mnt', ['bold']],
    ['pro', ['bold']]
  ])]
]);

//method for getting filters from BO
function transformFiltersFromBO(){

    const conslegFilters = tocEliFiltersConsleg;
    const ojFilters = tocEliFiltersOj;

    if(conslegFilters){
        filtersByTypeOfDocument.set('CONSLEG', conslegFilters.split(','));
    }

    if(ojFilters){
        filtersByTypeOfDocument.set('OJ', ojFilters.split(','));
    }

}

//method for translating the given ELI subdivision code
function translateEliSubdivisions(eliSubdivisionCode = '', suffix) {

  let translatedEliSubdivision = (eliSubdivisionLabels && eliSubdivisionLabels[eliSubdivisionCode.toUpperCase()]) || eliSubdivisionCode;
  let defaultLabels = [translatedEliSubdivision];

  if (suffix) {
    defaultLabels.push(suffix);
  }

  return defaultLabels.join(' ');
}

//method for getting css style per type of document and ELI subdivision
function getCssStyles(eliSubdivision, typeOfDocument) {
  const stylesByType = stylesByTypeOfDocument.get(typeOfDocument);
  const styles = stylesByType && stylesByType.get(eliSubdivision) || [];
  const boldStyle = styles.includes('bold') ? 'font-weight:bold;' : '';
  const italicStyle = styles.includes('italic') ? 'font-style:italic;' : '';

  return styles.length > 0 ? `${boldStyle}${italicStyle}` : '';
}

//method for checking ELI subdivision code
function checkExactMatchOfEliSubdivisionCode(id = '') {
  return eliSubdivisions.includes(id.toUpperCase());
}

//method for extracting ELI subdivision code
function extractEliSubdivisionCode(id = '') {
  return id.substring(0, 3);
}

//method for checking if the element starts with an ELI subdivision code
function startsWithEliSubdivision(element = ''){
    if(element.length < 3){
  	    return false;
    }

    let eli = extractEliSubdivisionCode(element);

    return checkExactMatchOfEliSubdivisionCode(eli);
}

//method for extracting value after underscore
function extractValueAfterUnderscore(id = '') {
  let idx = id.indexOf("_");
  return idx === -1 ? '' : id.substring(idx + 1);
}

//method for splitting the token wwithin a given id (e.g. tis_2.cpt_10.sct)
function splitId(id = '') {
  return id.split('.');
}

//method for checking a provided ID attribute
function checkIdAttributeValue(id = '') {
  let parts = splitId(id) || [];
  let numberOfToken = parts.length;
  let numberOfTokenApproved = 0;

  parts.forEach(elementId => {
    let eliSubdivision = extractEliSubdivisionCode(elementId);
    if (checkExactMatchOfEliSubdivisionCode(eliSubdivision)) {
      ++numberOfTokenApproved;
    }
  });

  //In case of label, we take the n-1 token (before tit/tis if any) into consideration (e.g. tis_1.cpt_1.sct_1.tit => sct).
  //In case od structural ELI, we take the last one (e.g. tis_1.cpt_1.sct => sct).
  let lastToken = numberOfToken > 1 && (parts[numberOfToken - 1] === 'tit' || parts[numberOfToken - 1] === 'tis')
    ? parts[numberOfToken - 2] : parts[numberOfToken - 1];
  let lastTokenEliSubdivision = extractEliSubdivisionCode(lastToken);

  //For case when ID is tocIDXXX
  let idSize = id.length;
  if(idSize > 3 && numberOfToken === 1 && id.charAt(3) !== "_" && id.charAt(3) !== "."){
    return {
        id: id,
        numberOfToken: numberOfToken,
        approved: false
    }
  }

  return {
    id: id,
    numberOfToken: numberOfToken,
    numberOfTokenApproved: numberOfTokenApproved,
    approved: numberOfToken === numberOfTokenApproved,
    lastToken: lastToken,
    lastTokenEliSubdivision: lastTokenEliSubdivision,
    lastTokenValueAfterUnderscore: extractValueAfterUnderscore(lastToken),
    usedAsLabel: id.endsWith('.tit') || id.endsWith('.tis')
  }

}

//method for creating the data structure used to generate the TOC
function traverseEliStructure(rootId = 'document1', typeOfDocument = 'CONSLEG') {

  //we get the applied filters
  const filters = filtersByTypeOfDocument.get(typeOfDocument) || [];

  //init of the returned data
  let data = {
    id: 'root',
    labels: [],
    children: []
  };

  //we get the HTML element to be parsed
  var element = document.getElementById(rootId);

  //method for getting label within a given label element (e.g. art_1.tit or art_1.tis). We get the text of the first p element within that div
  function getLabel(node) {
    return cleanTextLabel(node.getElementsByTagName('p')[0].innerHTML);
  }

  //method for detecting an ELI structural subdivision
  function detectEliStructuralSubdivision(node, data) {
    //we get the element ID
    var id = node.id;
    //we get the element tag name
    var tagName = node.tagName;
    //data object to be passed from parent to children
    var objToBePassed = data;

    //only DIV with id attribute are considered
    if (id && tagName === 'DIV') {

      //we check if the ID value match the required pattern and return the ELI structural subdivisions information.
      var element = checkIdAttributeValue(id);

      //when the element is (1) approved and (2) structural and (3) not in the filters list, we insert the new structural element in the current data structural element.
      if (element && element.approved && !element.usedAsLabel && !filters.includes(element.lastTokenEliSubdivision)) {
        //init new structural element
        var obj = {
          id: id,
          eliSubdivision: element.lastTokenEliSubdivision,
          suffix: element.lastTokenValueAfterUnderscore,
          labels: [],
          cssStyles: getCssStyles(element.lastTokenEliSubdivision, typeOfDocument),
          children: []
        };
        //we'll return the new structural element for further processing
        objToBePassed = obj;
        //add the new structural element to the current data structural element
        data.children.push(obj);
      }

      //when the element is (1) approved and (2) not structural and (3) not in the filters list, we insert the label in the current data structural element.
      if (element && element.approved && element.usedAsLabel && !filters.includes(element.lastTokenEliSubdivision)) {
        data.labels.push(getLabel(node));
      }

    }

    //return data structural element
    return objToBePassed;
  }

  //recursive method for checking all nodes of the parse document
  function testNodes(node, test, data) {

    var objToBePassed = detectEliStructuralSubdivision(node, data);

    node = node.firstChild;
    while (node) {
      testNodes(node, test, objToBePassed);
      node = node.nextSibling;
    }

  }

  //init recursive method
  testNodes(element, detectEliStructuralSubdivision, data);
  return data;
}

//method for generating li element
function generateLiElement(item = {}, topLabel = '', topLevelId = '') {
  let hasChildren = item.children && item.children.length > 0;
  let eliSubdivision = item.eliSubdivision;
  let suffix = item.suffix;
  let labels = item.labels || [];
  let cssStyles = item.cssStyles ? ` style="${item.cssStyles}"` : '';
  //we consider the top link an exact match of a TIT element which should be placed at the top of the document
  let isTopLink = item.id === 'tit' && !suffix;
  let topLinkClass = isTopLink ? ' topLink' : '';

  //if we have labels we take those otherwise we take the eli subdivision code and suffix
  let textElement = labels.length > 0 ? labels.join(' - ') : translateEliSubdivisions(eliSubdivision, suffix);
  let labelElement = isTopLink ? topLabel : textElement;
  let hrefElement = topLevelId ? topLevelId : item.id;
  let innerElement = hasChildren ? `<i class="glyphicon glyphicon-chevron-right"></i>${labelElement}` : labelElement;

  return `<li class="list-group-item${topLinkClass}"><a${cssStyles} href="#${hrefElement}">${innerElement}</a>`;
}

//method for processing the TOC based on the generated data structure
function processEliSubdivisionsDataStructure(data = [], topLabel, titleCount = 0, selector = '') {

  let temp = '';

  for (let item of data) {

        //MAIN DOCUMENT TITLE = TIT
    	if(item.id === 'tit' && titleCount === 0){
        	//generate li element with new ID (resolved issue with TIT duplicate IDs)
            let topLevelId = `${selector}-topLink`;
        	temp += generateLiElement(item, topLabel, topLevelId);
            changeTopLevelIdForEli(selector);
            //increment title counter
            ++titleCount;
        }

        //OTHER STRUCTURAL ELI SUBDIVISIONS
        if(item.id !== 'tit'){
        	//generate li element
        	temp += generateLiElement(item, topLabel);
        }

    //when children are available
    if (item.children && item.children.length > 0) {
      //recursively generate children
      let innerElements = processEliSubdivisionsDataStructure(item.children, topLabel, titleCount, selector);
      temp += `<ul class="list-group collapse">${innerElements}</ul>`;
    }

    //close li element
    temp += '</li>';

  }

  return temp;

}

//method for generating the TOC based on the data structure.
function generateTOCForEliSubdivision(selector, documentType, topLabel) {
    //we count the number of title included. Should be for a document not greater than 1
    let titleCount = 0;

    //get filters from BO
    transformFiltersFromBO();

    //create data structure
    let data = traverseEliStructure(selector, documentType);

    //we use in case of only tit elements the old algo
    if(hasOnlyTitElements(data)){
          return undefined;
    }

    //we generate TOC only if at least one subdivision exists
    if (data.children && data.children.length > 0) {

          let links = processEliSubdivisionsDataStructure(data.children, topLabel, titleCount, selector);

          return `<ul id="TOC_${selector}" class="toc-eli-subdivisions list-group toc-sidenav">${links}</ul>`;

    }

    return undefined;

}

//method for checking if we have only tit elements
function hasOnlyTitElements(data){

	let titCounter = 0;
    let size = 0;

	if(data.children && data.children.length>0){
        size = data.children.length;

        for(const item of data.children){
            if(item.id === 'tit'){
                ++titCounter;
            }
        }
    }

    return size === titCounter;
}

//method for changing ID of title
function changeTopLevelIdForEli(selector){
	$(`#${selector} div[id=tit]`).first().attr("id", `${selector}-topLink`);
}

//method for cleaning label
function cleanTextLabel(text = '') {
  //remove possible embedded links in text with regex.
  var linkRegex = /<a(.|\s)*?\>(.|\n)*?(?=<\/a>)<\/a>/gm;
  var newText = text.replace(linkRegex, "");
  newText = newText.replace("◄", "");
  //remove any span
  newText = newText.replace(/<\/?span[^>]*>/g,"");
  return newText;
}

//method used for expand/collapse node in TOC
function toggleTocEliMenu(selector) {
  $(`#TOC_${selector} li`).on('click', function(e) {
    $(this).children('ul').toggle();
    $('.glyphicon', this)
      .toggleClass('glyphicon-chevron-right')
      .toggleClass('glyphicon-chevron-down');
    //WE MUST STOP PROPAGATION OTHERWISE THE EXPAND/COLLAPSE DO NOT WORK PROPERLY
    e.stopPropagation();
  });
}

//Listener for adding active class on link
function tocListenerOnActiveLink() {
  $('.toc-eli-subdivisions .list-group-item a').on('click', function(e) {
    $('.toc-eli-subdivisions .list-group-item a').removeClass("active");
    $(this).addClass("active");
  });

  //when clicking top bar we remove any active class in the TOC
  $('.topBar a').on('click', function(e) {
    $('.toc-eli-subdivisions .list-group-item a').removeClass("active");
  });
}

//EURLEXNEW-4576

//method used for appending a hash when eliSubdivisionsWithDots is available
function eliResolutionResolver(relativeRequestUrl = '') {

    //split the ELI subdivisions dots to an array
    let arrayEliSubdivisions = retrieveEliResolutionPathFromRelativeRequestUrl(relativeRequestUrl);

    console.log(`The used ELI Subdivisions are : ${arrayEliSubdivisions}`)

    //we get array from first level available
    let arrayFromFirstLevelFound = constructEliPathFromFirstLevel(arrayEliSubdivisions);

    let size = arrayFromFirstLevelFound.length;

    let id = traverseEliResolutionPath(arrayFromFirstLevelFound, size - 1, size - 1);

    if (id) {
      console.log(`The document will be scrolled to ${id}`);
      scrollToProvidedId(id);
    }

}

//method for traversing ELI resolution path
function traverseEliResolutionPath(arrayFromFirstLevel, from, to) {

  let id = generateIDFromEliSubdivisions(arrayFromFirstLevel, from, to);

  if (hasElementWithId(id)) {
    return id;
  }

  if (from > 0 && to > 0) {
    return traverseEliResolutionPath(arrayFromFirstLevel, from - 1, to);
  }

  if (from === 0 && to > 0) {
    return traverseEliResolutionPath(arrayFromFirstLevel, from, to - 1);
  }

}

//method for generating an ID dynamically from array
function generateIDFromEliSubdivisions(arrayFromFirstLevel, from, to) {
  let temp = arrayFromFirstLevel.slice(from, to + 1);
  return temp.join('.');
}

//method for generating the Eli path from first level
function constructEliPathFromFirstLevel(array = []) {
  let size = array.length;
  let lastIdx = size > 0 ? size - 1 : size;
  let firstLevelIdx = -1;

  for (let i = lastIdx; i >= 0; i--) {
    if (hasElementWithId(array[i])) {
      firstLevelIdx = i;
      break;
    }
  }

  return firstLevelIdx !== -1 ? array.slice(firstLevelIdx) : [];
}

//check if element with ID exists
function hasElementWithId(id) {
  return document.getElementById(id);
}

//method for retrieving the ELI subdivisions within the provided path
function retrieveEliResolutionPathFromRelativeRequestUrl(relativeRequestUrl = ''){
	let pathElements = relativeRequestUrl.split('/');
    let values = [];

    for(const element of pathElements){
  	    if(startsWithEliSubdivision(element)){
    	    values.push(element);
        }
    }

    return values;
}

//method used to scroll to the provided ID
function scrollToProvidedId(id){

    let idToScrollTo = id === 'tit' ? 'textTabContent' : id;

    if($(`#${idToScrollTo}`).length){
        $('html, body').animate({
            scrollTop: $(`#${idToScrollTo}`).offset().top
        }, 'fast');
    }
}

//EURLEXNEW-4571: method to reset the scroll to the URL anchor position.
function scrollToCurrentUrlAnchor(){
    let hash = $(location).attr('hash');
    if(hash){
        scrollToProvidedId(hash.substring(1));
    }
}