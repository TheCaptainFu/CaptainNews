// CaptainNews.gr - Cookie Consent Configuration
window.addEventListener('load', function(){
    var cc = initCookieConsent();

    cc.run({
        current_lang: 'el',
        autoclear_cookies: true, 
        page_scripts: true, // Αυτό είναι που ενεργοποιεί το Analytics μετά την αποδοχή

        // Εμφάνιση (Dark Mode με τα χρώματά σου)
        gui_options: {
            consent_modal: {
                layout: 'cloud',               // box/cloud/bar
                position: 'bottom center',     // bottom/middle/top + left/right/center
                transition: 'slide'            // zoom/slide
            },
            settings_modal: {
                layout: 'box',
                transition: 'slide'
            }
        },

        languages: {
            'el': {
                consent_modal: {
                    title: 'Χρησιμοποιούμε cookies 🍪',
                    description: 'Χρησιμοποιούμε cookies για να βελτιώσουμε την εμπειρία σου και να μετράμε την επισκεψιμότητα.',
                    primary_btn: {
                        text: 'Αποδοχή όλων',
                        role: 'accept_all'
                    },
                    secondary_btn: {
                        text: 'Απόρριψη',
                        role: 'accept_necessary'
                    }
                },
                settings_modal: {
                    title: 'Ρυθμίσεις Cookies',
                    save_settings_btn: 'Αποθήκευση επιλογών',
                    accept_all_btn: 'Αποδοχή όλων',
                    reject_all_btn: 'Απόρριψη όλων',
                    close_btn_label: 'Κλείσιμο',
                    blocks: [
                        {
                            title: 'Χρήση Cookies',
                            description: 'Χρησιμοποιούμε cookies για την ορθή λειτουργία του ιστότοπου και για στατιστικούς λόγους.'
                        }, {
                            title: 'Απαραίτητα Cookies',
                            description: 'Απαραίτητα για τη λειτουργία της ιστοσελίδας.',
                            toggle: {
                                value: 'necessary',
                                enabled: true,
                                readonly: true
                            }
                        }, {
                            title: 'Analytics & Στατιστικά',
                            description: 'Μας βοηθούν να καταλάβουμε πώς χρησιμοποιείτε την ιστοσελίδα (Google Analytics).',
                            toggle: {
                                value: 'analytics',     // ΠΡΟΣΟΧΗ: Αυτό συνδέεται με το HTML attribute που βάλαμε
                                enabled: false,
                                readonly: false
                            }
                        }
                    ]
                }
            }
        }
    });
});