/* Для интеграции на страницу вызывайте calculateAll.show(param, path). В param можно передать DOM элемент, который будет являться родителем калькулятору.
 * Path - путь к папке с файлами картинок фона(пример "../calculateImg"). Если path не передавать, то путь по умолчанию будет 'img/'.
 * Если парам не передавать, то автоматически будет передано <body> и калькулятор отрисуется в <body>.
 * Тело имеет точный размер. Желательно не интегрировать в блоки, меньшие чем height: '312px', width: '215px'
 * Можно интегрировать несколько экземпляров на экран, но правильно будет работать лишь первый из-за того, что манипуляции с выводом происходят на
 * уровне ID (для скорости). Можно было конечно сделать иначе, но лично я не знаю зачем может понадобиться несколько экземпляров калькулятора.
 * В любом случае изменения потребуются минимальные и при необходимости можно будет сделать и вариант, работающий с несколькими объектами калькулятора
 * на экране.
 * Тестировалось в Chrome 47, IE 11, Firefox 43 и Opera 12.17.
 * Для работы необходима предзагрузка библиотеки jQuery.js (подробнее jquery.com)
 */
var $ = jQuery,
    calculateAll = {
        resultInt: "0",      //результат
        memCheck: false,     //проверка на наличие сохраненного значения
        memValue: '0',       //значение сохраненного в М числа
        functionLog: '',     //значения лога операций
        ifFloat: false,      //проверка на наличие дробной части
        newNumber: true,     //проверка на то, является ли значение "результата" вновь вводимым числом
                             //или же это результат предыдущей операции
        tempRes: '',         //последнее значение поля "результат" для операций с несколькими числами (последнее число)
        labelOfOperation: '',//метка операции с двумя числовыми значениями
        resultIntShort: '',  //переменные для вывода на экран в формате toExponential
        resultIntShort2: '', //переменные для вывода на экран в формате toExponential
        lastResult: '',      //результат последнего энтера для бинарных опираций
        lastOperate: false,  //проверка на выполнение дополнительных действий со значениями (sqrt) в бинарных (+,-,*,/) выражениях (для логов)
        ifResult: false,     //если использовалось "="
        path: 'img',         //значение пути к файлам бэкграунда по-умолчанию
        SHORT_LENGTH_RESULT: 12,    //CONST - длины строк вывода
        LONG_LENGTH_RESULT: 16,
        DOUBLE_LENGTH_RESULT: 19,
        MAX_LOG_LENGTH: 25,
        docs: function () {
            'use strict';
            console.log('Для интеграции на страницу вызывайте calculateAll.show(param, Path). В param можно передать DOM элемент, который будет являться родителем калькулятору.');
            console.log('Path - путь к папке с файлами картинок фона(пример "../calculateImg"). Если path не передавать, то путь по умолчанию будет \'img/\'.');
            console.log('Если param не передавать, то автоматически будет передано <body> и калькулятор отрисуется в <body>.');
            console.log('Тело имеет точный размер. Желательно не интегрировать в блоки, меньшие чем height: \'312px\', width: \'215px\'');
            console.log('Если вы хотите убрать его, то повторно вызовите calculateAll.show(param). Он не будет спрятан, а удалится из DOM.');
            console.log('Можно интегрировать несколько экземпляров на экран, но правильно будет работать лишь первый из-за того, что манипуляции с выводом происходят на');
            console.log('уровне ID (для скорости). Можно было конечно сделать иначе, но лично я не знаю зачем может понадобиться несколько экземпляров калькулятора.');
            console.log('В любом случае изменения потребуются минимальные и при необходимости можно будет сделать и вариант, работающий с несколькими объектами калькулятора');
            console.log('на экране.');
            console.log('Тестировалось в Chrome 47, IE 11, Firefox 43 и Opera 12.17.');
            console.log('Для работы необходима предзагрузка библиотеки jQuery.js (подробнее jquery.com)');
            return ':endOf';
        },
        help: function () {
            'use strict';
            var msg = "",
                textPRu = 'Основные функции: <br/>[MC]: очищает сохраненное в памяти калькулятора значение<br/>[MR]: читает из памяти калькулятора \
                предварительно сохраненное значение<br/>[MS]: сохраняет в память калькулятора текущее значение числа<br/>[M+]: прибавляет к сохраненному \
                в памяти числу текущее<br/>[M-]: отнимает от сохраненного в памяти числа текущее<br/>[←]: удаление на дисплее последнего введенного знака \
                <br/>[CE]: удаление последнего введенного числа без удаления первого, истории и очистки памяти<br/>[C]: удаление всех значений <br/>[±]: \
                изменение математического знака числа на дисплее на противоположный<br/>[√]: вычисление квадратного корня<br/>[/]: деление<br/>[+]: \
                сложение<br/>[%]: вычисление процентов<br/>[*]: умножение<br/>[1/x]: вычисление 1 / (текущее значение)<br/>[-]: вычитание<br/>[=]: \
                выполнение операции, либо повтор предыдущей операции. Если после выполнения предыдущей операции вы решили совершить другое действие \
                с предыдущим результатом, то нажмите на соответствующий знак (+ , - , * , /), а затем повторно зажмите на знак равно. Пример можно \
                посмотреть ниже<br/><br/>Примеры использования калькулятора: <br/>необходимо отнять 20% от числа: 555[-]20[%][=]. Результат 444<br/>\
                необходимо к одному числу прибавить корень второго: 444[+]9[√][=]. Результат 447<br/>необходимо от первого числа отнять второе, а затем \
                результат умножить на второе число: 5[-]2[*][=]. Результат 6<br/><br/>Изначально стояла задача сделать программу, максимально похожую \
                на встроенный в Windows 8.1 калькулятор. Тестировалось моей девушкой, так что не уверен в том, что предусмотрел все. Если у Вас есть \
                вопросы, то задать их можно тут: hardsing@gmail.com, skype: yankee.by, linkedIn: \
                <a href=\\\'https://www.linkedin.com/in/yury-hrynko-b04b4659\\\'>https://www.linkedin.com/in/yury-hrynko-b04b4659</a><br/>Гринько Юрий',
                textPEn = 'Main functions: <br/> [MC]: clears the stored value calculator <br/> [MR]: reads from the calculator\\\'s memory pre-stored \
                value <br/>[MS]: saves the current value to the memory of the calculator<br/>[M+]: add current value to saved in the memory<br/>[M-]: \
                subtraction current value from stored in the memory<br/>[←]: delete the last entered on the display sign <br/> [CE]: delete the last \
                number entered without deleting the first, history and memory clearing <br/> [C]: deletes all values <br/> [±]: change mathematical sign \
                of the display to the opposite <br/> [√]: calculating the square root <br/> [/]: division <br/> [+]: addition<br/> [%]: the calculation \
                of percent <br/> [*]: multiplication <br/> [1x]: calculation of 1 / (current value) <br/> [-]: subtraction <br/> [=] : operation, or \
                repeat the previous operation. If after the previous operation you choose to perform another action with the previous result, click on \
                the appropriate sign (+, -, *, /), and then use sign \\\'=\\\'. An example can be seen below <br/><br/>Examples of using calculator: <br/> \
                need to subtract 20% of the number: 555[-]20[%][=]. Result 444 <br/> one number you need to add the root of the second: 444[+]9[√][=]. \
                Result 447 <br/> need to subtract the second from the first value, and then multiply the result by the second number: 5[-]2[*][=]. Result \
                6 <br/> <br/>Originally had the task to make the program as much as possible similar to the built-in Windows 8.1 Calculator. It was tested \
                by my girlfriend, so I\\\'m not sure is that everything is all right. If you have questions, you can ask them here: hardsing@gmail.com, \
                skype: yankee.by, linkedIn: <a href=\\\'https://www.linkedin.com/in/yury-hrynko-b04b4659\\\'>https://www.linkedin.com/in/yury-hrynko-b04b4659</a>\
                <br/>Hrinko Yuri',
                popup;
            msg = '<head><meta http-equiv=\"Content-Type\" content=\"text/html; charset=windows-1251\" /><link rel="shortcut ';
            msg += 'icon\" href=\"' + calculateAll.path + '/ico.ico\" type=\"image/x-icon\"/><style>body {background-color: black;} div#pBody {color: black;';
            msg += 'padding-left: 3%; padding-right: 1%;  margin: 0 auto; background-color: white; width: 60%; border: 3px ridge #8E9CAD;';
            msg += 'border-radius: 3px 3px 3px 3px; text-align: left; font: bold 14px monospace;} button { margin-left: 90%;}</style>';
            msg += '<title>Help</title>';
            msg += "<body><div id=\'divBody\'><button id=\'buttonEnRu\' onclick=\"changeIt()\" value=''></button><div id=\"pBody\"></div></div><script>";
            msg += 'var textPRu = \'' + textPRu;
            msg += "',textPEn = '" + textPEn;
            msg += "', chkLng = true, buttonTextRu = \'Ru\', buttonTextEn = \'En\', button = document.getElementById(\'buttonEnRu\'), magicP = "
            msg += 'document.getElementById(\'pBody\'); (function () {button.innerHTML = buttonTextEn; magicP.innerHTML = textPRu; }()); ';
            msg += 'function changeIt() {if (chkLng) {chkLng = false; button.innerHTML = buttonTextRu; magicP.innerHTML = textPEn;} else {';
            msg += 'chkLng = true; button.innerHTML = buttonTextEn; magicP.innerHTML = textPRu;}}<\/script></body></html>';
            popup = window.open("", "Help for Calculator", "height=500, width=500, top=300, left=1300, scrollbars=1");
            popup.document.write(msg);
            popup.document.close();
            return false;
        }
    };

calculateAll.show = function (parentNode, path) {//принимает DOM элемент родителя и путь к папке с jpg.
    'use strict';
    var megaDiv = document.createElement('div'),
        mHeaderDiv = document.createElement('div'),
        mMenuDiv = document.createElement('div'),
        mResultDiv = document.createElement('div'),
        mNumTable = document.createElement('table'),
        m_hd_table = document.createElement('table'),
        m_hd_t_tr = document.createElement('tr'),
        m_hd_t_tr_td1 = document.createElement('td'),
        m_hd_t_tr_td2 = document.createElement('td'),
        m_hd_t_tr_td1_img = document.createElement('img'),
        m_md_table = document.createElement('table'),
        m_md_t_tr = document.createElement('tr'),
        m_md_t_tr_td1 = document.createElement('td'),
        m_md_t_tr_td2 = document.createElement('td'),
        m_md_t_tr_td3 = document.createElement('td'),
        m_rd_table = document.createElement('table'),
        m_rd_t_tr1 = document.createElement('tr'),
        m_rd_t_tr2 = document.createElement('tr'),
        m_rd_t_tr1_td1 = document.createElement('td'),
        m_rd_t_tr1_td2 = document.createElement('td'),
        m_rd_t_tr2_td1 = document.createElement('td'),
        m_rd_t_tr2_td2 = document.createElement('td'),
        m_nt_tr6 = document.createElement('tr'),
        m_nt_tr6_td1 = document.createElement('td'),
        m_nt_tr6_td2 = document.createElement('td'),
        m_nt_tr6_td3 = document.createElement('td'),
        i, //cnt
        j,  //cnt
        cntId = 1, //cnt for table
        tempClass1 = 'CALCbuttons CALCtranssmall',
        tempClass2 = 'CALCbuttons CALCtranssmall CALCnumpad',
        tempClass3 = 'CALCbuttons CALCtranssmall CALCdouble',
        tempClass4 = 'CALCbuttons CALCtranssmall2',
        tempTr,
        tempTd;

    megaDiv.setAttribute('class', 'CALCbody');
    mResultDiv.setAttribute('class', 'CALCresult CALCtransmore');
    mHeaderDiv.setAttribute('class', 'CALCheader');
    mMenuDiv.setAttribute('class', 'CALCmenu');
    mNumTable.setAttribute('id', 'CALCtouch');

    m_hd_table.setAttribute('class', 'CALCtitle');
    m_hd_t_tr_td2.setAttribute('id', 'CALClogo');
    m_hd_t_tr_td2.innerHTML = 'Калькулятор';
    m_hd_t_tr_td1_img.setAttribute('src', calculateAll.path + '/calc.jpg');

    m_hd_t_tr_td1.appendChild(m_hd_t_tr_td1_img);
    m_hd_t_tr.appendChild(m_hd_t_tr_td1);
    m_hd_t_tr.appendChild(m_hd_t_tr_td2);
    m_hd_table.appendChild(m_hd_t_tr);
    mHeaderDiv.appendChild(m_hd_table);//rdy

    m_md_t_tr_td1.setAttribute('id', 'CALCview');
    m_md_t_tr_td1.setAttribute('class', 'CALCoffline');
    m_md_t_tr_td1.innerHTML = 'Вид';
    m_md_t_tr_td2.setAttribute('id', 'CALCsettings');
    m_md_t_tr_td2.setAttribute('class', 'CALCoffline');
    m_md_t_tr_td2.innerHTML = 'Правка';
    m_md_t_tr_td3.setAttribute('id', 'CALChelp');
    m_md_t_tr_td3.innerHTML = 'Справка';

    m_md_t_tr.appendChild(m_md_t_tr_td1);
    m_md_t_tr.appendChild(m_md_t_tr_td2);
    m_md_t_tr.appendChild(m_md_t_tr_td3);
    m_md_table.appendChild(m_md_t_tr);
    mMenuDiv.appendChild(m_md_table);//rdy

    m_rd_table.setAttribute('id', 'CALCresultbox');
    m_rd_t_tr2.setAttribute('class', 'CALCprintres');
    m_rd_t_tr1_td1.setAttribute('class', 'CALCsmallchar CALCleftside');
    m_rd_t_tr1_td1.setAttribute('id', 'CALCforspecial');
    m_rd_t_tr1_td1.innerHTML = '(c)';
    m_rd_t_tr1_td2.innerHTML = 'function';
    m_rd_t_tr1_td2.setAttribute('class', 'CALCsmallchar CALCrightside');
    m_rd_t_tr1_td2.setAttribute('id', 'CALCresultfunction');
    m_rd_t_tr2_td1.setAttribute('class', 'CALCsmallchar CALCleftside CALClastline');
    m_rd_t_tr2_td1.setAttribute('id', 'CALCresultmem');
    m_rd_t_tr2_td1.innerHTML = 'M';
    m_rd_t_tr2_td2.innerHTML = '0';
    m_rd_t_tr2_td2.setAttribute('class', 'CALCrightside CALClastline');
    m_rd_t_tr2_td2.setAttribute('id', 'CALCresult');

    m_rd_t_tr1.appendChild(m_rd_t_tr1_td1);
    m_rd_t_tr1.appendChild(m_rd_t_tr1_td2);
    m_rd_t_tr2.appendChild(m_rd_t_tr2_td1);
    m_rd_t_tr2.appendChild(m_rd_t_tr2_td2);
    m_rd_table.appendChild(m_rd_t_tr1);
    m_rd_table.appendChild(m_rd_t_tr2);
    mResultDiv.appendChild(m_rd_table);//rdy

    for (i = 1; i <= 5; i += 1) {
        tempTr = document.createElement('tr');
        for (j = 1; j <= 5; j += 1) {
            tempTd = document.createElement('td');
            tempTd.setAttribute('id', 'CALCtds-' + cntId);
            if (cntId <= 10 || cntId === 15 || cntId === 20) {
                tempTd.setAttribute('class', tempClass1);
            } else {
                if ((cntId >= 11 && cntId <= 13) || (cntId >= 16 && cntId <= 18) || (cntId >= 21 && cntId <= 23)) {
                    tempTd.setAttribute('class', tempClass2);
                } else {
                    if (cntId === 14 || cntId === 19 || cntId === 24) {
                        tempTd.setAttribute('class', tempClass3);
                    } else {
                        tempTd.setAttribute('class', tempClass4);
                        tempTd.setAttribute('rowspan', '2');
                    }
                }
            }
            tempTr.appendChild(tempTd);
            cntId += 1;
        }
        mNumTable.appendChild(tempTr);
    }

    m_nt_tr6_td1.setAttribute('class', tempClass2);
    m_nt_tr6_td1.setAttribute('id', 'CALCtds-26');
    m_nt_tr6_td1.setAttribute('colspan', '2');
    m_nt_tr6_td2.setAttribute('class', tempClass2);
    m_nt_tr6_td2.setAttribute('id', 'CALCtds-27');
    m_nt_tr6_td3.setAttribute('class', tempClass3);
    m_nt_tr6_td3.setAttribute('id', 'CALCtds-28');

    m_nt_tr6.appendChild(m_nt_tr6_td1);
    m_nt_tr6.appendChild(m_nt_tr6_td2);
    m_nt_tr6.appendChild(m_nt_tr6_td3);

    mNumTable.appendChild(m_nt_tr6);//rdy

    megaDiv.appendChild(mHeaderDiv);
    megaDiv.appendChild(mMenuDiv);
    megaDiv.appendChild(mResultDiv);
    megaDiv.appendChild(mNumTable);

    if (path !== '' && path) {
        calculateAll.path = path; //меняем стандартный путь на наш
    }
    if (!parentNode) {
        parentNode = document.body;
    }
    if ($(parentNode).children('div.CALCbody').length > 0) {
        $(parentNode).children('div.CALCbody').remove();
    } else {
        parentNode.appendChild(megaDiv);


        (function () {//загрузка кнопок и т.п.
            var arrayOfLabel = ['MC', 'MR', 'MS', 'M+', 'M-', '←', 'CE', 'C', '±', '̓√', 7, 8, 9, '/', '%', 4, 5, 6, '*', '1/x', 1, 2, 3, '-', '=', 0, ',', '+'],
                chker;
            for (chker = 1; chker < arrayOfLabel.length + 1; chker += 1) {
                $('#CALCtds-' + chker, 'div.CALCbody').text(arrayOfLabel[chker - 1]);
            }

            $('div.CALCbody').css({
                height: '312px',
                width: '215px',
                margin: '0 auto',
                color: 'black',
                'background-color': '#D9E4F1',
                'border-color': '#a866e2',
                'border-style': 'solid',
                'border-top-width': '3px',
                'border-right-width': '8px',
                'border-bottom-width': '8px',
                'border-left-width': '8px'
            });
            $('div.CALCheader', 'div.CALCbody').css({
                border: 'none'
            });
            $('div.CALCresult', 'div.CALCbody').css({
                border: '1px ridge #8E9CAD',
                'border-radius': '3px 3px 3px 3px',
                'margin-left': '10px',
                'margin-right': '10px',
                'margin-top': '8px',
                'padding-right': '5px',
                'padding-left': '5px',
                'text-align': 'right',
                height: '51px',
                font: 'normal 22px monospace'
            });
            $('div.CALCbody table.CALCtitle tr td img').css({
                width: "12px",
                height: '15px',
                border: 'none'
            });
            $('div.CALCbody table.CALCtitle tr').css({
                height: '18px'
            });
            $('table#CALCresultbox > tr:first-child', 'div.CALCbody').css({
                height: '15px',
                border: 'none'
            });
            $('.CALCoffline', 'div.CALCbody').css({
                'background-color': '#F5F5F5',
                color: '#696969',
                border: 'none'
            });
            $('.CALCtitle', 'div.CALCbody').css({
                cursor: 'default',
                width: '216px',
                height: '20px',
                margin: '0',
                padding: '0',
                'text-align': 'center',
                'background-color': '#a866e2',
                'border-bottom': '5px solid #a866e2',
                '-webkit-user-select': 'none',
                '-moz-user-select': 'none',
                '-ms-user-select': 'none',
                'border-top': 'none',
                'border-left': 'none',
                'border-right': 'none'
            });
            $('.CALCtransmore', 'div.CALCbody').css({
                'background-color': 'white',
                'background-position': 'left top',
                'background-image': 'url(' + calculateAll.path + '/more.jpg)',
                'background-repeat': 'repeat-x'
            });
            $('.CALCtranssmall', 'div.CALCbody').css({
                "background-position": 'left bottom',
                'background-image': 'url(' + calculateAll.path + '/small.jpg)',
                'background-repeat': 'repeat-x'
            });
            $('.CALCtranssmall2', 'div.CALCbody').css({
                "background-position": 'left bottom',
                'background-image': 'url(' + calculateAll.path + '/small2.jpg)',
                'background-repeat': 'repeat-x'
            });
            $('.CALCheader', 'div.CALCbody').css({
                font: 'normal 15px sans-serif'
            });
            $('div.CALCmenu', 'div.CALCbody').css({
                cursor: 'default',
                'background-color': '#f5f6f7',
                font: 'normal 12px sans-serif',
                'padding-left': '3px',
                'border-bottom': '1px solid #f0f0f0',
                'border-top': 'none',
                'border-left': 'none',
                'border-right': 'none',
                height: '19px',
                '-webkit-user-select': 'none',
                '-moz-user-select': 'none',
                '-ms-user-select': 'none'
            });
            $('div.CALCmenu > table', 'div.CALCbody').css({
                border: 'none'
            });
            $('#CALClogo', 'div.CALCbody').css({
                'text-align': 'left',
                'font-style': 'bold',
                border: 'none'
            });
            $('#CALCview', 'div.CALCbody').css({
                width: '3em',
                border: 'none'
            });
            $('#CALCsettings', 'div.CALCbody').css({
                width: '4em',
                border: 'none'
            });
            $('#CALChelp', 'div.CALCbody').css({
                width: '4em',
                border: "1px solid #f5f6f7"
            });
            $('.CALCsmallchar', 'div.CALCbody').css({
                'font-size': '11px',
                'text-align': 'right'
            });
            $('#CALCresultbox', 'div.CALCbody').css({
                width: '100%',
                height: '51px',
                border: 'none'
            });
            $('table.CALCtitle tr td', 'div.CALCbody').css({
                border: 'none'
            });
            $('.CALCrightside', 'div.CALCbody').css({
                'text-align': 'right',
                font: 'normal monospace',
                border: 'none',
                'white-space': 'nowrap'
            });
            $('.CALCleftside', 'div.CALCbody').css({
                'text-align': 'center',
                width: '20px',
                border: 'none'
            });
            $('.CALClastline', 'div.CALCbody').css({
                height: '70%'
            });
            $('.CALCprintres', 'div.CALCbody').css({
                height: '10px',
                border: 'none'
            });
            $('.CALCbuttons', 'div.CALCbody').css({
                cursor: 'default',
                '-webkit-user-select': 'none',
                '-moz-user-select': 'none',
                '-ms-user-select': 'none',
                width: '25px',
                height: '20px',
                border: '1px solid #8E9CAD',
                'border-radius': '3px 3px 3px 3px',
                'text-align': 'center',
                font: 'normal 15px monospace'
            });
            $('#CALCtouch', 'div.CALCbody').css({
                'border-spacing': '7px 8px',
                'margin-left': '3px',
                'margin-right': '0px',
                padding: '0px',
                'text-align': 'center',
                width: '97%'
            });
            $('table#CALCtouch > tr', 'div.CALCbody').css({
                border: 'none'
            });
            $('#CALCtds-25', 'div.CALCbody').css({
                font: 'normal 17px monospace'
            });
            $('#CALCtds-6', 'div.CALCbody').css({
                font: 'normal 17px monospace'
            });
            $('#CALCtds-20', 'div.CALCbody').css({
                font: 'normal 12px monospace'
            });
            $('#CALCforspecial', 'div.CALCbody').css({
                font: 'normal 11px "Times New Roman"'
            });
            $('#CALCresult', 'div.CALCbody').css({
                font: 'normal 22px "Times New Roman"'
            });

            $('#CALCresult', 'div.CALCbody').text('0');
            $('#CALCresultmem', 'div.CALCbody').text('');
            $('#CALCresultfunction', 'div.CALCbody').text('');
            $('#CALCforspecial', 'div.CALCbody').text('');

            //events
            $('#CALCtds-2', 'div.CALCbody').on('click', function () {
                return calculateAll.doMR();
            });
            $('.CALCbuttons', 'div.CALCbody').on('mouseenter', function () {
                return calculateAll.changeBG(this.id);
            }).on('mouseleave', function () {
                return calculateAll.returnBG(this.id);
            }).on('click', function () {
                return calculateAll.changeButSize(this.id);
            });
            $('#CALChelp', 'div.CALCbody').on('mouseenter', function () {
                return calculateAll.changeBgMenu(this.id);
            }).on('mouseleave', function () {
                return calculateAll.returnBgMenu(this.id);
            }).on('click', function () {
                return calculateAll.help();
            });
            $('#CALCtds-3').on('click', function () {
                return calculateAll.doMS($('#CALCresult', 'div.CALCbody').text());
            });
            $('#CALCtds-4', 'div.CALCbody').on('click', function () {
                return calculateAll.doMplus();
            });
            $('#CALCtds-5', 'div.CALCbody').on('click', function () {
                return calculateAll.doMminus();
            });
            $('.CALCnumpad', 'div.CALCbody').on('click', function () {
                return calculateAll.doNum(this.id);
            });
            $('#CALCtds-8', 'div.CALCbody').on('click', function () {
                return calculateAll.doC();
            });
            $('#CALCtds-7', 'div.CALCbody').on('click', function () {
                return calculateAll.doCE();
            });
            $('#CALCtds-6', 'div.CALCbody').on('click', function () {
                return calculateAll.doShort($('#CALCresult', 'div.CALCbody').text());
            });
            $('#CALCtds-10', 'div.CALCbody').on('click', function () {
                return calculateAll.doSqrt($('#CALCresult', 'div.CALCbody').text());
            });
            $('#CALCtds-9', 'div.CALCbody').on('click', function () {
                return calculateAll.doNegate($('#CALCresult', 'div.CALCbody').text());
            });
            $('#CALCtds-20', 'div.CALCbody').on('click', function () {
                return calculateAll.doReciproc($('#CALCresult', 'div.CALCbody').text());
            });
            $('.CALCdouble', 'div.CALCbody').on('click', function () {
                return calculateAll.doCALCdouble(this.id, calculateAll.resultInt || '0', calculateAll.tempRes);
            });
            $('#CALCtds-15', 'div.CALCbody').on('click', function () {
                return calculateAll.doPercent(calculateAll.resultInt, calculateAll.tempRes);
            });
            $('#CALCtds-25', 'div.CALCbody').on('click', function () {
                calculateAll.ifResult = true;
                if (calculateAll.newNumber) {//если был ввод нового числа в двоичной операции
                    return calculateAll.doEnter(calculateAll.resultInt || calculateAll.lastResult, calculateAll.tempRes || $('#CALCresult', 'div.CALCbody').text(), calculateAll.labelOfOperation);
                } else {//если работаем с результатом, вычисленным до этого
                    return calculateAll.doEnter(calculateAll.resultInt || $('#CALCresult', 'div.CALCbody').text(), calculateAll.tempRes || calculateAll.lastResult, calculateAll.labelOfOperation);
                    //doEnter(resultInt || $('#CALCresult').text(), lastResult || tempRes, labelOfOperation);
                }
            });
            $(document).ready(console.log('Для вызова справки по скрипту: calculateAll.docs()'));
            $(document).ready(console.log('--------------------------------------------------'));
        }());
    }
    cntId = 0;
};

calculateAll.changeBG = function (id) {
    'use strict';
    if (id !== 'CALCtds-25') {
        $('#' + id, 'div.CALCbody').css("background-image", "url(" + calculateAll.path + "/small_gold.jpg)");
    } else {
        $('#' + id, 'div.CALCbody').css("background-image", "url(" + calculateAll.path + "/small2_gold.jpg)");
    }
};

calculateAll.returnBG = function (id) {
    'use strict';
    if (id !== 'CALCtds-25') {
        $('#' + id, 'div.CALCbody').css("background-image", "url(" + calculateAll.path + "/small.jpg)");
    } else {
        $('#' + id, 'div.CALCbody').css("background-image", "url(" + calculateAll.path + "/small2.jpg)");
    }
};

calculateAll.changeButSize = function (id) {
    'use strict';
    var tempFont = $('#' + id, 'div.CALCbody').css('font-size');

    if (id !== 'CALCtds-20') {
        $('#' + id, 'div.CALCbody').animate({fontSize: '120%'}, 1).delay(60).animate({fontSize: tempFont}, 1);
    } else {
        $('#' + id, 'div.CALCbody').animate({fontSize: '115%'}, 1).delay(60).animate({fontSize: tempFont}, 1);
    }
};

calculateAll.changeBgMenu = function (id) {
    'use strict';
    $('#' + id, 'div.CALCbody').css({border: "1px solid #336699", "background-color": '#B8D8F9'});
};

calculateAll.returnBgMenu = function (id) {
    'use strict';
    $('#' + id, 'div.CALCbody').css({border: "1px solid #f5f6f7", "background-color": '#f5f6f7'});
};

//result&log
calculateAll.changeRes = function (result, func) { //func для проверки необходимости увеличения длинны выводимого значения (пределов) в результате арифметических операций
    'use strict';
    var tempResLen = result.split('').length;

    try {
        if (!Number.isFinite(result * 1)) {
            return calculateAll.doC(1);
        }
    } catch (e) {
        console.log('Этот браузер не поддерживает .isFinite. ' + e.name + ":" + e.message + ';');
    }

    calculateAll.resultInt = result;

    if (result.split('').indexOf('.') !== -1) { ///обрезание запятой если она есть
        calculateAll.ifFloat = false;
    } else {
        calculateAll.ifFloat = true;
        if (result.split('').indexOf('.') === result.split('').length - 1) {
            result = result.split('').slice(0, result.split('').length - 2);
        }
    }
    if (func) {
        if (tempResLen > calculateAll.DOUBLE_LENGTH_RESULT) {//20
            $('#CALCresult', 'div.CALCbody').css('fontSize', '11px');
            calculateAll.resultIntShort = (result * 1).toExponential(calculateAll.DOUBLE_LENGTH_RESULT);
        }
        if (tempResLen <= calculateAll.DOUBLE_LENGTH_RESULT && tempResLen > calculateAll.SHORT_LENGTH_RESULT) {
            $('#CALCresult', 'div.CALCbody').css('fontSize', '17px');
            calculateAll.resultIntShort = result;
        }
        if (tempResLen <= calculateAll.SHORT_LENGTH_RESULT) {
            $('#CALCresult', 'div.CALCbody').css('fontSize', '22px');
            calculateAll.resultIntShort = result;
        }
    } else {
        if (tempResLen <= calculateAll.LONG_LENGTH_RESULT && tempResLen > calculateAll.SHORT_LENGTH_RESULT) {
            $('#CALCresult', 'div.CALCbody').css('fontSize', '17px');
        }
        if (tempResLen <= calculateAll.SHORT_LENGTH_RESULT) {
            $('#CALCresult', 'div.CALCbody').css('fontSize', '22px');
        }
        calculateAll.resultIntShort = result;
    }

    $('#CALCresult', 'div.CALCbody').text(calculateAll.resultIntShort);
};

calculateAll.changeTempRes = function (result) {//принимает второе число
    'use strict';
    var tempResLen = result.split('').length;

    try {
        if (!Number.isFinite(result * 1)) {
            return calculateAll.doC(1);
        }
    } catch (e) {
        console.log('Этот браузер не поддерживает .isFinite. ' + e.name + ":" + e.message + ';');
    }
    calculateAll.tempRes = result;

    if (result.split('').indexOf('.') !== -1) { //убираем запятую, если она есть
        calculateAll.ifFloat = false;
    } else {
        calculateAll.ifFloat = true;
        if (result.split('').indexOf('.') === result.split('').length - 1) {
            result = result.split('').slice(0, result.split('').length - 2);
        }
    }

    if (tempResLen > calculateAll.DOUBLE_LENGTH_RESULT) {//20
        $('#CALCresult', 'div.CALCbody').css('fontSize', '11px');
        calculateAll.resultIntShort2 = (result * 1).toExponential(calculateAll.DOUBLE_LENGTH_RESULT);
    }
    if (tempResLen <= calculateAll.DOUBLE_LENGTH_RESULT && tempResLen > calculateAll.SHORT_LENGTH_RESULT) {
        $('#CALCresult', 'div.CALCbody').css('fontSize', '17px');
        calculateAll.resultIntShort2 = result;
    }
    if (tempResLen <= calculateAll.SHORT_LENGTH_RESULT) {
        $('#CALCresult', 'div.CALCbody').css('fontSize', '22px');
        calculateAll.resultIntShort2 = result;
    }

    $('#CALCresult', 'div.CALCbody').text(calculateAll.resultIntShort2);
};

calculateAll.changeLog = function (operate, log, bool, log2) {/*(принимает либо название бинарной операции (+,-,*,/) либо имя функции, первое значение числа, флаг -
                                                является ли лог результатом бинарного выражения, значение второго числа)*/
    'use strict';
    var tempArrLog = [],
        tempLog;
    switch (operate) {
    case "+":
        operate = '\u002b';
        break;
    case "-":
        operate = '\u002d';
        break;
    case "*":
        operate = '\u002a';
        break;
    case "/":
        operate = '\u002f';
        break;
    }

    if (bool === true) {
        calculateAll.functionLog = operate + '(' + (calculateAll.functionLog || log) + ')';
        tempArrLog = calculateAll.functionLog.split(''); //вывод последних 20 символов массива лога
        if (tempArrLog.length <= calculateAll.MAX_LOG_LENGTH) {
            $('#CALCresultfunction', 'div.CALCbody').text(calculateAll.functionLog);
            $('#CALCforspecial', 'div.CALCbody').text('');
        } else {
            tempLog = tempArrLog.slice(tempArrLog.length - calculateAll.MAX_LOG_LENGTH, tempArrLog.length).join('');
            $('#CALCforspecial', 'div.CALCbody').text('«');
            $('#CALCresultfunction', 'div.CALCbody').text(tempLog);
        }
    } else {
        if (log2 === undefined) {
            log2 = '';
        }
        if (/^-?[0-9]+/ig.test(log2) && (operate !== '\u002b' && operate !== '\u002d' && operate !== '\u002a' && operate !== '\u002f')) {
            calculateAll.functionLog = (calculateAll.functionLog || log || '') + calculateAll.labelOfOperation + operate + '(' + log2 + ")";
        } else {
            calculateAll.functionLog = (calculateAll.functionLog || log || '') + ' ' + operate + ' ' + log2;
        }

        tempArrLog = calculateAll.functionLog.split(''); //вывод последних MAX_LOG_LENGTH символов массива лога
        if (tempArrLog.length <= calculateAll.MAX_LOG_LENGTH) {
            $('#CALCresultfunction', 'div.CALCbody').text(calculateAll.functionLog);
            $('#CALCforspecial', 'div.CALCbody').text('');
        } else {
            tempLog = tempArrLog.slice(tempArrLog.length - calculateAll.MAX_LOG_LENGTH, tempArrLog.length).join('');
            $('#CALCforspecial', 'div.CALCbody').text('«');
            $('#CALCresultfunction', 'div.CALCbody').text(tempLog);
        }
    }
};

//M+,-,C,R,S
calculateAll.doMS = function (result) {//принимает текущее значение
    'use strict';
    if (result === '0.') {
        calculateAll.changeRes('0');
    } else {
        if (!calculateAll.memCheck) {
            calculateAll.memCheck = true;
        }
        $('#CALCresultmem', 'div.CALCbody').text('M');
        calculateAll.memValue = result;
    }
};

calculateAll.doMR = function () {
    'use strict';
    if (calculateAll.memCheck === true) {
        if (calculateAll.memValue.slice().indexOf('.') !== -1) {
            calculateAll.ifFloat = true;
        } else {
            calculateAll.ifFloat = false;
        }
        if (calculateAll.labelOfOperation !== '') {
            calculateAll.changeTempRes(calculateAll.memValue, 1);
        } else {
            calculateAll.changeRes(calculateAll.memValue, 1);
        }
        calculateAll.newNumber = false;
    }
};

calculateAll.doMC = function () {
    'use strict';
    if (calculateAll.memCheck === true) {
        calculateAll.memValue = '';
        $('#CALCresultmem', 'div.CALCbody').text('');
        calculateAll.memCheck = false;
    }
};
$('#CALCtds-1', 'div.CALCbody').on('click', function () {
    'use strict';
    calculateAll.doMC();
});

calculateAll.doMplus = function () {
    'use strict';
    var tempMemPlus = 0;
    if (calculateAll.memCheck) {
        tempMemPlus = calculateAll.memValue * 1 + calculateAll.resultInt * 1;
    } else {
        calculateAll.memCheck = true;
        $('#CALCresultmem', 'div.CALCbody').text('M');
        tempMemPlus = calculateAll.resultInt * 1;
    }
    calculateAll.memValue = String(tempMemPlus);
    calculateAll.newNumber = false;
};

calculateAll.doMminus = function () {
    'use strict';
    var tempMemMinus = 0;
    if (calculateAll.memCheck) {
        tempMemMinus = calculateAll.memValue * 1 - calculateAll.resultInt * 1;
    } else {
        calculateAll.memCheck = true;
        $('#CALCresultmem', 'div.CALCbody').text('M');
        tempMemMinus = -calculateAll.resultInt * 1;
    }
    calculateAll.memValue = String(tempMemMinus);
    calculateAll.newNumber = false;
};

//number
calculateAll.doNum = function (id) {//принимает id div-a
    'use strict';
    var tempNum = '';
    switch (id) {
    case 'CALCtds-21':
        tempNum = "1";
        break;
    case 'CALCtds-22':
        tempNum = "2";
        break;
    case 'CALCtds-23':
        tempNum = "3";
        break;
    case 'CALCtds-26':
        tempNum = "0";
        break;
    case 'CALCtds-16':
        tempNum = "4";
        break;
    case 'CALCtds-17':
        tempNum = "5";
        break;
    case 'CALCtds-18':
        tempNum = "6";
        break;
    case 'CALCtds-11':
        tempNum = "7";
        break;
    case 'CALCtds-12':
        tempNum = "8";
        break;
    case 'CALCtds-13':
        tempNum = "9";
        break;
    case 'CALCtds-27':
        tempNum = '.';
        break;
    }
    if (!(calculateAll.resultInt === "0" && calculateAll.tempRes === '0' && tempNum === "0")) {
        calculateAll.doRes(tempNum);
    }
};

calculateAll.doRes = function (tempNum) {//принимает цифры и "."
    'use strict';
    var tempArrRes,
        tempLength,
        localLength = $('#CALCresult', 'div.CALCbody').text().length,
        doResTemp;

    if (calculateAll.labelOfOperation === '') {
        doResTemp = calculateAll.resultInt;
    } else {
        doResTemp = calculateAll.tempRes;
    }

    tempArrRes = doResTemp.split('');

    if (localLength < calculateAll.SHORT_LENGTH_RESULT + 1) {
        $('#CALCresult', 'div.CALCbody').css('fontSize', '22px');
        tempLength = calculateAll.SHORT_LENGTH_RESULT;
    } else {
        $('#CALCresult', 'div.CALCbody').css('fontSize', '17px');
        tempLength = calculateAll.LONG_LENGTH_RESULT;
    }

    if (calculateAll.ifFloat || ($('#CALCresult', 'div.CALCbody').text()) * 1 < 0) {
        tempLength += 1;
    }

    if (!calculateAll.newNumber && calculateAll.ifResult === true) {  //сброс если мы начинаем ввод чисел поверх предыдущего результата бинарного выражения
        $('#CALCforspecial', 'div.CALCbody').text('');
        $('#CALCresultfunction', 'div.CALCbody').text('');
        calculateAll.functionLog = ''; // !!Clear log
        $('#CALCresult', 'div.CALCbody').css('fontSize', '22px');
        doResTemp = '';
        calculateAll.newNumber = true;
        calculateAll.ifFloat = false;
        calculateAll.ifResult = false;
        calculateAll.resultInt = '0';
        calculateAll.tempRes = '';
        calculateAll.resultIntShort = '';
        calculateAll.resultIntShort2 = '';
        calculateAll.labelOfOperation = '';
        return calculateAll.doRes(tempNum);
    }

    if (!calculateAll.newNumber) {// сброс значения при вводе цифр поверх предыдущего результата выражения
        if (calculateAll.labelOfOperation === '') {
            $('#CALCforspecial', 'div.CALCbody').text('');
            $('#CALCresultfunction', 'div.CALCbody').text('');
            calculateAll.functionLog = ''; // !!Clear log //!!
        }
        $('#CALCresult', 'div.CALCbody').css('fontSize', '22px');
        doResTemp = '';
        calculateAll.newNumber = true;
        calculateAll.ifFloat = false;
        if (calculateAll.labelOfOperation === '') {
            calculateAll.resultInt += doResTemp;
        } else {
            calculateAll.tempRes += doResTemp;
        }
        return calculateAll.doRes(tempNum);
    }

    if (tempArrRes.length < tempLength) {
        if (calculateAll.newNumber) {
            if (calculateAll.ifFloat && tempNum === '.') {
                calculateAll.ifFloat = true;
            } else {
                if (tempNum === '.') {
                    doResTemp += tempNum;
                    calculateAll.ifFloat = true;
                } else {
                    if (doResTemp === '0') { //
                        doResTemp = tempNum;
                    } else {
                        doResTemp += tempNum;
                    }
                }
            }
        }
        if (calculateAll.labelOfOperation === '') {
            calculateAll.resultInt = doResTemp;
        } else {
            calculateAll.tempRes = doResTemp;
        }
        $('#CALCresult', 'div.CALCbody').text(doResTemp);
    }
};

//C
calculateAll.doC = function (lim) {//принимает: 1) если вышли за пределы MAX_VALUE, 2) если делим на 0, 3) если берем корень от отрицательных значений
    'use strict';
    calculateAll.newNumber = false;
    calculateAll.resultInt = "0";
    calculateAll.functionLog = '';
    calculateAll.ifFloat = false;
    calculateAll.tempRes = '';
    calculateAll.resultIntShort = ''; //переменные для вывода на экран в сокращенной записи
    calculateAll.resultIntShort2 = '';
    calculateAll.labelOfOperation = '';
    $('#CALCresult', 'div.CALCbody').css('fontSize', '22px');
    calculateAll.lastResult = '';
    calculateAll.lastOperate = false;

    $('#CALCresultfunction', 'div.CALCbody').text('');
    $('#CALCforspecial', 'div.CALCbody').text('');
    switch (lim) {
    case 1:
        $('#CALCresult', 'div.CALCbody').text('Переполнение');
        break;
    case 2:
        $('#CALCresult', 'div.CALCbody').css('fontSize', '11px');
        $('#CALCresult', 'div.CALCbody').text('Деление на ноль невозможно');
        break;
    case 3:
        $('#CALCresult', 'div.CALCbody').css('fontSize', '11px');
        $('#CALCresult', 'div.CALCbody').text('Недопустимый ввод');
        break;
    default:
        $('#CALCresult', 'div.CALCbody').text('0');
        break;
    }
};

calculateAll.doCE = function () {//удаляет последее введенное значение
    'use strict';
    calculateAll.ifFloat = false;
    calculateAll.tempRes = '0';
    calculateAll.resultIntShort2 = '';
    calculateAll.newNumber = true;
    if (calculateAll.labelOfOperation === '') {
        calculateAll.resultInt = '0';
        calculateAll.resultIntShort = '';
    }
    $('#CALCresult', 'div.CALCbody').text('0');
};

//<--
calculateAll.doShort = function (result) {//принимает текущее значение
    'use strict';
    var tempDoShort;
    if (calculateAll.newNumber) {
        if (calculateAll.labelOfOperation === '') {
            tempDoShort = result.split('');
            if (tempDoShort.length === 1) {
                calculateAll.changeRes('0');
            } else {
                calculateAll.changeRes(tempDoShort.slice(0, tempDoShort.length - 1).join(''));
            }
        } else {//для операций с несколькими числами
            tempDoShort = result.split('');
            if (tempDoShort.length === 1) {
                calculateAll.changeTempRes('0');
            } else {
                calculateAll.changeTempRes(tempDoShort.slice(0, tempDoShort.length - 1).join(''));
            }
        }
    }
    if (calculateAll.labelOfOperation === '') {
        if (calculateAll.resultInt.split('').indexOf('.') !== -1) {
            calculateAll.ifFloat = true;
        } else {
            calculateAll.ifFloat = false;
        }
    } else {
        if (calculateAll.tempRes.split('').indexOf('.') !== -1) {
            calculateAll.ifFloat = true;
        } else {
            calculateAll.ifFloat = false;
        }
    }
};

//sqrt
calculateAll.doSqrt = function (result) {//принимает текущее значение
    'use strict';
    calculateAll.newNumber = false;
    if (1 * result < 0) {
        return calculateAll.doC(3);
    }
    if (calculateAll.ifResult === true) { //если нажимался знак =, то сбрасывает лог
        $('#CALCresultfunction', 'div.CALCbody').text('');
        $('#CALCforspecial', 'div.CALCbody').text('');
        calculateAll.functionLog = '';
    }
    if (calculateAll.labelOfOperation === '') {
        calculateAll.changeLog('sqrt', result, true);
        calculateAll.changeRes('' + Math.sqrt(calculateAll.resultInt * 1), 1);
    } else {
        calculateAll.changeTempRes('' + Math.sqrt($('#CALCresult', 'div.CALCbody').text() * 1)); //tempRes
        if (calculateAll.ifResult === false) { // если число вводится после нажатия =, то логи выводятся в формате функции
            calculateAll.changeLog('sqrt', (calculateAll.resultIntShort || calculateAll.resultInt), false, result);
        } else {
            calculateAll.changeLog('sqrt', result, true);
        }
        calculateAll.lastOperate = true;
    }
};

//+/-
calculateAll.doNegate = function (result) {//принимает текущее значение
    'use strict';
    var tempArrRes = result.split('');
    if (result !== '0') {
        if (tempArrRes[0] !== '-') {
            tempArrRes.reverse().push('-');
            tempArrRes.reverse();
        } else {
            tempArrRes.splice(0, 1);
        }
        if (calculateAll.labelOfOperation === '') {
            calculateAll.changeLog('negate', result, true);
            return calculateAll.changeRes('' + tempArrRes.join(''), 1);
        } else {
            if ((result === calculateAll.resultInt || result === calculateAll.resultIntShort) && result !== calculateAll.tempRes) {
                return calculateAll.changeRes('' + tempArrRes.join(''), 1);
            } else {
                return calculateAll.changeTempRes('' + tempArrRes.join(''));
            }
        }
    }
};

//1/x
calculateAll.doReciproc = function (result) {//принимает текущее значение
    calculateAll.newNumber = false;
    result.length = calculateAll.LONG_LENGTH_RESULT;
    if (calculateAll.ifResult === true) { //если нажимался знак =, то сбрасывает лог
        $('#CALCresultfunction', 'div.CALCbody').text('');
        $('#CALCforspecial', 'div.CALCbody').text('');
        calculateAll.functionLog = '';
    }
    if (1 * result === 0) {
        calculateAll.changeLog('reciproc', result, true);
        return calculateAll.doC(2);
    } else {
        if (calculateAll.labelOfOperation === '') {
            calculateAll.changeRes('' + 1 / result, 1);
            calculateAll.changeLog('reciproc', result, true);
        } else {
            if ((result === calculateAll.resultInt || result === calculateAll.resultIntShort) && result !== calculateAll.tempRes) {
                calculateAll.changeRes('' + 1 / result, 1);
            } else {
                calculateAll.changeTempRes('' + 1 / result);
            }

            if (calculateAll.ifResult === false) {  //если число вводится после нажатия =, то логи выводятся в формате функции
                calculateAll.changeLog('reciproc', (calculateAll.resultIntShort2 || calculateAll.tempRes), false, result);
            } else {
                calculateAll.changeLog('reciproc', result, true);
            }
            calculateAll.lastOperate = true;
        }
    }
};

//+-*/%
calculateAll.doCALCdouble = function (id, firstRes, lastRes) {//принимает id div-a кнопок действий(+,-,*,/), первое и второе значение чисел
    'use strict';
    calculateAll.ifResult = false;
    var tempOperate = '';
    switch (id) {
    case 'CALCtds-28':
        tempOperate = '+';
        if (lastRes === '') {//lastRes == ''
            calculateAll.changeLog('', $('#CALCresult', 'div.CALCbody').text(), false);
        }
        return calculateAll.doAll(firstRes, lastRes, tempOperate);
    case 'CALCtds-24':
        tempOperate = '-';
        if (lastRes === '') {
            calculateAll.changeLog('', $('#CALCresult', 'div.CALCbody').text(), false);
        }
        return calculateAll.doAll(firstRes, lastRes, tempOperate);
    case 'CALCtds-19':
        tempOperate = '*';
        if (lastRes === '') {
            calculateAll.changeLog('', $('#CALCresult', 'div.CALCbody').text(), false);
        }
        return calculateAll.doAll(firstRes, lastRes, tempOperate);
    case 'CALCtds-14':
        tempOperate = '/';
        if (lastRes === '') {
            calculateAll.changeLog('', $('#CALCresult', 'div.CALCbody').text(), false);
        }
        return calculateAll.doAll(firstRes, lastRes, tempOperate);
    }
};

calculateAll.doPercent = function (firstRes, lastRes) {//принимает первое число, второе введенное (в качестве величины процента). Только для бинарных операций
    'use strict';
    if (calculateAll.labelOfOperation === '') {
        return calculateAll.doC();
    } else {
        return calculateAll.changeTempRes(firstRes / 100 * lastRes + '');
    }
};

calculateAll.doEnter = function (firstRes, lastRes, operate) {//принимает первое число, второе число, оператор действия
    'use strict';
    calculateAll.newNumber = false;
    if (operate === '') {//если оператор не передан - берем оператор из выполненного до этого действия
        operate = calculateAll.labelOfOperation;
    }
    var labelList = ['+', '-', '*', '/'];
    if (labelList.indexOf(operate) !== -1) {
        switch (operate) {//действия в зависимости от знака
        case '+':
            if (lastRes !== '') {
                calculateAll.changeRes(((firstRes * 1) + (lastRes * 1)) + '', 1);
                if (calculateAll.lastOperate === true) { //если логи выводились при обработке одного из двух чисел, передаваемых в функцию, то повторно не выводим
                    calculateAll.lastOperate = false;
                } else {
                    calculateAll.changeLog('+', '', false, lastRes);
                }
            }
            calculateAll.lastResult = lastRes;//сохраняем последнее значение если нам нужно повторять его (нажимая =)
            calculateAll.tempRes = '';//сбрасываем значение второго числа
            break;
        case '-':
            if (lastRes !== '') {
                calculateAll.changeRes(((firstRes * 1) - (lastRes * 1)) + '', 1);
                if (calculateAll.lastOperate === true) {
                    calculateAll.lastOperate = false;
                } else {
                    calculateAll.changeLog('-', '', false, lastRes);
                }
            }
            calculateAll.lastResult = lastRes;
            calculateAll.tempRes = '';
            break;
        case '*':
            if (lastRes !== '') {
                calculateAll.changeRes(((firstRes * 1) * (lastRes * 1)) + '', 1);
                if (calculateAll.lastOperate === true) {
                    calculateAll.lastOperate = false;
                } else {
                    calculateAll.changeLog('*', '', false, lastRes);
                }
            }
            calculateAll.lastResult = lastRes;
            calculateAll.tempRes = '';
            break;
        case '/':
                 //если делим на 0
            if (lastRes !== '') {
                if (lastRes * 1 === 0) {
                    return calculateAll.doC(2);
                }
                calculateAll.changeRes(((firstRes * 1) / (lastRes * 1)) + '', 1);//function changeRes(result,func)
                if (calculateAll.lastOperate === true) {
                    calculateAll.lastOperate = false;
                } else {
                    calculateAll.changeLog('/', '', false, lastRes);
                }
            }
            calculateAll.lastResult = lastRes;
            calculateAll.tempRes = '';
            break;
        }
    }
};

calculateAll.doAll = function (firstRes, lastRes, operate) {//принимает значения первого и второго числа, операцию (-,+,*,/)
    'use strict';
    calculateAll.newNumber = false;
    if (lastRes !== '') {//если оба значения были переданы
        calculateAll.doEnter(firstRes, lastRes, calculateAll.labelOfOperation);
        calculateAll.labelOfOperation = operate;//сохранить значение последней операции
    } else {    //если просто необходимо поменять случайно выбранный знак (+-*/), но не выполнять подсчет
        calculateAll.labelOfOperation = operate;
        calculateAll.tempRes = ''; //tempRes=lastRes;
    }
};