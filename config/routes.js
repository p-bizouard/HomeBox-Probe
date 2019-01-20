/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {

  /***************************************************************************
  *                                                                          *
  * Make the view located at `views/homepage.ejs` your home page.            *
  *                                                                          *
  * (Alternatively, remove this and add an `index.html` file in your         *
  * `assets` directory)                                                      *
  *                                                                          *
  ***************************************************************************/

  '/': { view: 'pages/homepage' },

  'get /': 'DefaultController.home',
  'get /sensors': 'DefaultController.sensors',

  'get /plug/:device': 'DefaultController.plugDeviceStatus',
  'post /plug/:device': 'DefaultController.plugDeviceStatusChange',

  'post /rf433/:device': 'DefaultController.rf433StatusChange',

  'get /vacuum/status': 'DefaultController.vacuumStatus',
  'get /vacuum/status/:status': 'DefaultController.vacuumStatusChange',

  'post /ping': 'DefaultController.ping',
  'post /switch': 'DefaultController.switch',

  'post /google-home': 'DefaultController.googleHomeSay',

  'get /xiaomi/:device/status': 'DefaultController.xiaomiSensorStatus',

  /***************************************************************************
  *                                                                          *
  * More custom routes here...                                               *
  * (See https://sailsjs.com/config/routes for examples.)                    *
  *                                                                          *
  * If a request to a URL doesn't match any of the routes in this file, it   *
  * is matched against "shadow routes" (e.g. blueprint routes).  If it does  *
  * not match any of those, it is matched against static assets.             *
  *                                                                          *
  ***************************************************************************/


};
