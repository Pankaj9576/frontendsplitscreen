import React, { useState, useEffect } from "react";
import {
  TabContainer,
  TabButton,
  TabContent,
  ScrollWrapper,
  PatentTabContent,
  PatentIframe,
} from "./StyledComponents";

const PatentTabbedInterface = ({
  patentData,
  activeTab,
  setActiveTab,
  availableTabs,
  onLinkClick,
  fetchContent,
}) => {
  const [currentImage, setCurrentImage] = useState(0);

  // Prevent browser viewport scrollbar
  useEffect(() => {
    document.body.style.overflowY = "hidden";
    return () => {
      document.body.style.overflowY = "auto";
    };
  }, []);

  const handleLinkClick = (url) => {
    onLinkClick(url);
    fetchContent();
  };

  const renderOverview = () => {
    return (
      <PatentTabContent>
        {patentData.title && (
          <>
            <h2>Title</h2>
            <p>{patentData.title}</p>
          </>
        )}
        {patentData.publicationNumber && (
          <>
            <h3>Publication Number</h3>
            <p>{patentData.publicationNumber}</p>
          </>
        )}
        {patentData.inventors?.length > 0 && (
          <>
            <h3>Inventors</h3>
            <p>{patentData.inventors.join(", ")}</p>
          </>
        )}
        {patentData.abstract && (
          <>
            <h3>Abstract</h3>
            <p>{patentData.abstract}</p>
          </>
        )}
      </PatentTabContent>
    );
  };

  const renderPDF = () => {
    return patentData.pdfUrl ? (
      <PatentIframe src={patentData.pdfUrl + "#view=FitH"} title="Patent PDF" />
    ) : (
      <p>No PDF available</p>
    );
  };

  const renderImages = () => {
    if (!patentData.drawings || patentData.drawings.length === 0) {
      return <p>No images available</p>;
    }

    return (
      <PatentTabContent>
        <div style={{ textAlign: "center", overflow: "hidden" }}>
          {patentData.drawings.map((drawing, index) => (
            <div key={index} style={{ marginBottom: "20px" }}>
              <img
                src={drawing}
                alt={`Drawing ${index + 1}`}
                style={{ maxWidth: "100%", margin: "10px 0" }}
              />
              <p>Image {index + 1} of {patentData.drawings.length}</p>
            </div>
          ))}
        </div>
      </PatentTabContent>
    );
  };

  const renderClaims = () => {
    return patentData.claims ? (
      <PatentTabContent dangerouslySetInnerHTML={{ __html: patentData.claims }} />
    ) : (
      <p>No claims available</p>
    );
  };

  const renderDescription = () => {
    return patentData.description ? (
      <PatentTabContent dangerouslySetInnerHTML={{ __html: patentData.description }} />
    ) : (
      <p>No description available</p>
    );
  };

  const renderClassifications = () => {
    if (!patentData.classifications || patentData.classifications.length === 0) {
      return <p>No classifications available</p>;
    }

    return (
      <PatentTabContent>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Code</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {patentData.classifications.map((classification, index) => (
              <tr key={index}>
                <td>{classification.type || "N/A"}</td>
                <td>{classification.code || "N/A"}</td>
                <td>{classification.description || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </PatentTabContent>
    );
  };

  const renderCitations = () => {
    if (!patentData.citations || patentData.citations.length === 0) {
      return <p>No citations available</p>;
    }

    return (
      <PatentTabContent>
        <table>
          <thead>
            <tr>
              <th>Publication Number</th>
              <th>Title</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {patentData.citations.map((citation, index) => (
              <tr key={index}>
                <td>
                  {citation.publicationNumber ? (
                    <a
                      href={citation.link || "#"}
                      onClick={(e) => {
                        e.preventDefault();
                        if (citation.link) handleLinkClick(citation.link);
                      }}
                    >
                      {citation.publicationNumber}
                    </a>
                  ) : (
                    "N/A"
                  )}
                </td>
                <td>{citation.title || "N/A"}</td>
                <td>{citation.date || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </PatentTabContent>
    );
  };

  const renderCitedBy = () => {
    if (!patentData.citedBy || patentData.citedBy.length === 0) {
      return <p>No cited-by documents available</p>;
    }

    return (
      <PatentTabContent>
        <table>
          <thead>
            <tr>
              <th>Publication Number</th>
              <th>Title</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {patentData.citedBy.map((cited, index) => (
              <tr key={index}>
                <td>
                  {cited.publicationNumber ? (
                    <a
                      href={cited.link || "#"}
                      onClick={(e) => {
                        e.preventDefault();
                        if (cited.link) handleLinkClick(cited.link);
                      }}
                    >
                      {cited.publicationNumber}
                    </a>
                  ) : (
                    "N/A"
                  )}
                </td>
                <td>{cited.title || "N/A"}</td>
                <td>{cited.date || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </PatentTabContent>
    );
  };

  const renderLegalEvents = () => {
    if (!patentData.legalEvents || patentData.legalEvents.length === 0) {
      return <p>No legal events available</p>;
    }

    return (
      <PatentTabContent>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Event</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {patentData.legalEvents.map((event, index) => (
              <tr key={index}>
                <td>{event.date || "N/A"}</td>
                <td>{event.event || "N/A"}</td>
                <td>{event.description || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </PatentTabContent>
    );
  };

  const renderPatentFamily = () => {
    if (!patentData.patentFamily || patentData.patentFamily.length === 0) {
      return <p>No patent family information available</p>;
    }

    return (
      <PatentTabContent>
        <table>
          <thead>
            <tr>
              <th>Publication Number</th>
              <th>Country</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {patentData.patentFamily.map((family, index) => (
              <tr key={index}>
                <td>
                  {family.publicationNumber ? (
                    <a
                      href={family.link || "#"}
                      onClick={(e) => {
                        e.preventDefault();
                        if (family.link) handleLinkClick(family.link);
                      }}
                    >
                      {family.publicationNumber}
                    </a>
                  ) : (
                    "N/A"
                  )}
                </td>
                <td>{family.country || "N/A"}</td>
                <td>{family.date || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </PatentTabContent>
    );
  };

  const renderSimilarDocuments = () => {
    if (!patentData.similarDocs || patentData.similarDocs.length === 0) {
      return <p>No similar documents available</p>;
    }

    return (
      <PatentTabContent>
        <table>
          <thead>
            <tr>
              <th>Publication Number</th>
              <th>Title</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {patentData.similarDocs.map((doc, index) => (
              <tr key={index}>
                <td>
                  {doc.publicationNumber ? (
                    <a
                      href={doc.link || "#"}
                      onClick={(e) => {
                        e.preventDefault();
                        if (doc.link) handleLinkClick(doc.link);
                      }}
                    >
                      {doc.publicationNumber}
                    </a>
                  ) : (
                    "N/A"
                  )}
                </td>
                <td>{doc.title || "N/A"}</td>
                <td>{doc.date || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </PatentTabContent>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "Overview":
        return renderOverview();
      case "PDF":
        return renderPDF();
      case "Images":
        return renderImages();
      case "Claims":
        return renderClaims();
      case "Description":
        return renderDescription();
      case "Classifications":
        return renderClassifications();
      case "Citations":
        return renderCitations();
      case "Cited By":
        return renderCitedBy();
      case "Legal Events":
        return renderLegalEvents();
      case "Patent Family":
        return renderPatentFamily();
      case "Similar Documents":
        return renderSimilarDocuments();
      default:
        return <p>Select a tab to view content</p>;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflowY: "hidden" }}>
      <TabContainer>
        {availableTabs.map((tab) => (
          <TabButton
            key={tab}
            $active={activeTab === tab}
            onClick={() => {
              setActiveTab(tab);
              setCurrentImage(0);
            }}
          >
            {tab}
          </TabButton>
        ))}
      </TabContainer>
      <TabContent>
        {["Images", "Classifications", "Citations", "Cited By", "Legal Events", "Patent Family", "Similar Documents"].includes(activeTab) ? (
          <ScrollWrapper>{renderTabContent()}</ScrollWrapper>
        ) : (
          renderTabContent()
        )}
      </TabContent>
    </div>
  );
};

export default PatentTabbedInterface;