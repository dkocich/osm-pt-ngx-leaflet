describe("Basic render test", () => {
  it("should assert that title is correct", () => {
    cy.visit("localhost:8080");
    cy.title().should("include", "Public Transport editor for OSM");
  });

  it("should see navigation bar elements", () => {
    cy.contains("About").should("be.visible");
    cy.contains("Blog").should("be.visible");
    cy.contains("Login").should("be.visible");
  });

  it("should change language", () => {
    cy.server();
    cy.route("/assets/i18n/cs.json").as("getCsLang");
    cy.contains("en").should("be.visible").click();
    cy.contains("Czech").should("be.visible").click();
    cy.wait("@getCsLang");
    cy.contains("OSM editor veřejné dopravy");
    cy.contains("cs").should("be.visible").click();
    cy.contains("Angličtina").should("be.visible").click();
  });
});

describe("Basic sidebar functionality", () => {
  it("should verify accordions togglability", () => {
    cy.contains("Relation").parent()
      .should("have.attr", "aria-expanded", "false")
      .click()
      .should("have.attr", "aria-expanded", "true");

    cy.contains("Tags").parent()
      .should("have.attr", "aria-expanded", "false")
      .click()
      .should("have.attr", "aria-expanded", "true");

    cy.contains("Routes").parent()
      .should("have.attr", "aria-expanded", "true")
      .click()
      .should("have.attr", "aria-expanded", "false")
      .click();

    cy.contains("Stops/platforms").parent()
      .should("have.attr", "aria-expanded", "true")
      .click()
      .should("have.attr", "aria-expanded", "false")
      .click();
  });
});

// TODO check existence of a new login popup - not implemented in Cypress yet?
// describe("OAuth login window visibility", () => {
//   it("should find and open login form", () => {
//     cy.contains("Login").click().;
//   });
// });

describe("Basic map functionality", () => {
  it("should verify geocoder and coordinate saving to URL", () => {
    cy.visit("localhost:8080");
    cy.url()
      .should("include", "#map=");

    cy.get("#place-input")
      .type("Frýdek-Místek")
      .should("have.value", "Frýdek-Místek");

    cy.get("#goto")
      .click();

    cy.url()
      .should("include", "#map=12/49.67972/18.34183");

    // zoom to lvl 12 to load data
    cy.get(".leaflet-control-zoom-in").click().click().click().click();
    cy.url()
      .should("include", "map=16");
  });

  it("should select a bus stop in the sidebar, highlight it and deselect again", () => {
    cy.get("stop-browser tbody tr").first().click().should("have.class", "selected");
    cy.get("#selection").contains("Cancel").click();
    cy.get("stop-browser tbody tr").first().should("not.have.class", "selected");
  });
});
