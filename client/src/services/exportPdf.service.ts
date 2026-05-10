// src/services/exportPdf.service.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toPng } from "html-to-image";

class ExportPdfService {
  private pdf: jsPDF;
  private yPos: number;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private sectionNumber: number;

  constructor() {
    this.pdf = new jsPDF("p", "mm", "a4");
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
    this.margin = 15;
    this.yPos = this.margin;
    this.sectionNumber = 0;
  }

  private checkPageBreak(neededSpace: number) {
    if (this.yPos + neededSpace > this.pageHeight - this.margin) {
      this.pdf.addPage();
      this.yPos = this.margin;
    }
  }

  // Header with logo area
  addReportHeader(dateFrom: string, dateTo: string) {
    // Title
    this.pdf.setFontSize(24);
    this.pdf.setTextColor(30, 41, 59);
    this.pdf.text("Taskflow Analytics Report", this.margin, this.yPos);
    this.yPos += 10;

    // Period
    this.pdf.setFontSize(11);
    this.pdf.setTextColor(100, 116, 139);
    this.pdf.text(
      `Report Period: ${dateFrom} to ${dateTo}`,
      this.margin,
      this.yPos,
    );
    this.yPos += 5;

    // Generated date
    this.pdf.setFontSize(9);
    this.pdf.text(
      `Generated: ${new Date().toLocaleString()}`,
      this.margin,
      this.yPos,
    );
    this.yPos += 8;

    // Line
    this.pdf.setDrawColor(59, 130, 246);
    this.pdf.setLineWidth(0.5);
    this.pdf.line(
      this.margin,
      this.yPos,
      this.pageWidth - this.margin,
      this.yPos,
    );
    this.yPos += 8;
  }

  // Section divider
  addSectionDivider(title: string) {
    this.sectionNumber++;
    this.checkPageBreak(20);

    // Blue bar
    this.pdf.setFillColor(59, 130, 246);
    this.pdf.rect(
      this.margin,
      this.yPos,
      this.pageWidth - this.margin * 2,
      7,
      "F",
    );

    // Section title
    this.pdf.setFontSize(11);
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.text(
      `${this.sectionNumber}. ${title}`,
      this.margin + 3,
      this.yPos + 5,
    );
    this.yPos += 12;
  }

  // KPI Cards as table
  addKPISection(kpiData: any) {
    this.addSectionDivider("KPI Summary");

    const kpis = [
      [
        "Total Tasks",
        kpiData.totalTasks?.toLocaleString() || "0",
        "Created in selected period",
      ],
      [
        "Completed",
        `${(kpiData.completed || 0).toLocaleString()} / ${(kpiData.totalTasks || 0).toLocaleString()}`,
        "Tasks marked as Done",
      ],
      [
        "Overdue",
        (kpiData.overdue || 0).toLocaleString(),
        kpiData.overdue > 0 ? "Past due date" : "No overdue tasks",
      ],
      [
        "On-Time Completion",
        `${kpiData.onTimeCompletion || 0}%`,
        "vs previous period",
      ],
      [
        "Avg. Completion Time",
        `${kpiData.avgCompletionTime || 0} days`,
        "From creation to Done",
      ],
      [
        "In Progress",
        (kpiData.inProgress || 0).toLocaleString(),
        "Currently active",
      ],
    ];

    autoTable(this.pdf, {
      startY: this.yPos,
      head: [["Metric", "Value", "Description"]],
      body: kpis,
      margin: { left: this.margin, right: this.margin },
      theme: "grid",
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 10,
        halign: "left",
      },
      bodyStyles: { fontSize: 10 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 50 },
        1: { cellWidth: 40 },
        2: { cellWidth: 80 },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    this.yPos = (this.pdf as any).lastAutoTable.finalY + 8;
  }

  // Status Distribution Table
  addStatusDistribution(statusData: any[]) {
    this.addSectionDivider("Status Distribution");

    const total = statusData.reduce(
      (sum: number, s: any) => sum + (s.value || 0),
      0,
    );
    const tableData = statusData.map((s: any) => [
      s.name || "Unknown",
      (s.value || 0).toString(),
      total > 0 ? `${((s.value / total) * 100).toFixed(1)}%` : "0%",
    ]);

    autoTable(this.pdf, {
      startY: this.yPos,
      head: [["Status", "Count", "Percentage"]],
      body: tableData,
      margin: { left: this.margin, right: this.margin },
      theme: "grid",
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 10,
      },
      bodyStyles: { fontSize: 10 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    this.yPos = (this.pdf as any).lastAutoTable.finalY + 8;
  }

  // Priority Breakdown Table
  addPriorityBreakdown(priorityData: any[]) {
    this.addSectionDivider("Priority Breakdown");

    const tableData = priorityData.map((p: any) => [
      p.name || "Unknown",
      (p.tasks || 0).toString(),
    ]);

    autoTable(this.pdf, {
      startY: this.yPos,
      head: [["Priority", "Count"]],
      body: tableData,
      margin: { left: this.margin, right: this.margin },
      theme: "grid",
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 10,
      },
      bodyStyles: { fontSize: 10 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    this.yPos = (this.pdf as any).lastAutoTable.finalY + 8;
  }

  // Task Details Table
  addTaskDetailsSection(tasks: any[]) {
    this.addSectionDivider("Task Details");

    if (!tasks || tasks.length === 0) {
      this.pdf.setFontSize(10);
      this.pdf.setTextColor(148, 163, 184);
      this.pdf.text(
        "No tasks found for the selected period",
        this.margin,
        this.yPos,
      );
      this.yPos += 10;
      return;
    }

    const tableData = tasks.map((task: any) => [
      task.title?.substring(0, 60) || "Untitled",
      task.assignee || "Unassigned",
      task.status || "N/A",
      task.priority || "N/A",
      task.team || "N/A",
      task.dueDate || "N/A",
      task.completedDate || "-",
      task.daysOverdue > 0 ? `${task.daysOverdue} days` : "On time",
      `${task.timeTaken || 0} days`,
    ]);

    autoTable(this.pdf, {
      startY: this.yPos,
      head: [
        [
          "Task Title",
          "Assignee",
          "Status",
          "Priority",
          "Team",
          "Due Date",
          "Completed",
          "Overdue",
          "Time",
        ],
      ],
      body: tableData,
      margin: { left: this.margin, right: this.margin },
      theme: "grid",
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 7,
      },
      bodyStyles: { fontSize: 7 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 18 },
        2: { cellWidth: 15 },
        3: { cellWidth: 13 },
        4: { cellWidth: 18 },
        5: { cellWidth: 16 },
        6: { cellWidth: 16 },
        7: { cellWidth: 14 },
        8: { cellWidth: 14 },
      },
    });

    this.yPos = (this.pdf as any).lastAutoTable.finalY + 8;
  }

  // Team Performance Table
  addTeamPerformanceSection(performanceData: any[]) {
    this.addSectionDivider("Team Performance");

    if (!performanceData || performanceData.length === 0) {
      this.pdf.setFontSize(10);
      this.pdf.setTextColor(148, 163, 184);
      this.pdf.text("No team data available", this.margin, this.yPos);
      this.yPos += 10;
      return;
    }

    const tableData = performanceData.map((member: any) => [
      member.name || "Unknown",
      member.team || "N/A",
      (member.tasksAssigned || 0).toString(),
      (member.tasksCompleted || 0).toString(),
      `${member.completionRate || 0}%`,
      `${member.onTimeRate || 0}%`,
      (member.overdueCount || 0).toString(),
      `${member.avgCompletionTime || 0}d`,
      `${member.workload || 0}%`,
    ]);

    autoTable(this.pdf, {
      startY: this.yPos,
      head: [
        [
          "Member",
          "Team",
          "Assigned",
          "Done",
          "Rate",
          "On-Time",
          "Overdue",
          "Avg Time",
          "Workload",
        ],
      ],
      body: tableData,
      margin: { left: this.margin, right: this.margin },
      theme: "grid",
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 8,
      },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 20 },
        2: { cellWidth: 16 },
        3: { cellWidth: 14 },
        4: { cellWidth: 14 },
        5: { cellWidth: 16 },
        6: { cellWidth: 16 },
        7: { cellWidth: 18 },
        8: { cellWidth: 16 },
      },
    });

    this.yPos = (this.pdf as any).lastAutoTable.finalY + 8;
  }

  // Team Workload Table
  addTeamWorkloadSection(workloadData: any[]) {
    this.addSectionDivider("Team Workload");

    if (!workloadData || workloadData.length === 0) {
      this.pdf.setFontSize(10);
      this.pdf.setTextColor(148, 163, 184);
      this.pdf.text("No workload data available", this.margin, this.yPos);
      this.yPos += 10;
      return;
    }

    const tableData = workloadData.map((team: any) => [
      team.name || "Unknown",
      (team.totalTasks || 0).toString(),
      (team.completedTasks || 0).toString(),
      (team.activeTasks || 0).toString(),
      (team.overdueTasks || 0).toString(),
      (team.memberCount || 0).toString(),
      `${team.completionRate || 0}%`,
    ]);

    autoTable(this.pdf, {
      startY: this.yPos,
      head: [
        ["Team", "Total", "Completed", "Active", "Overdue", "Members", "Rate"],
      ],
      body: tableData,
      margin: { left: this.margin, right: this.margin },
      theme: "grid",
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 10,
      },
      bodyStyles: { fontSize: 10 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    this.yPos = (this.pdf as any).lastAutoTable.finalY + 8;
  }

  // Attendance Trend Table
  addAttendanceSection(attendanceData: any[]) {
    this.addSectionDivider("Attendance Trend");

    if (!attendanceData || attendanceData.length === 0) {
      this.pdf.setFontSize(10);
      this.pdf.setTextColor(148, 163, 184);
      this.pdf.text("No attendance data available", this.margin, this.yPos);
      this.yPos += 10;
      return;
    }

    const tableData = attendanceData
      .slice(-14)
      .map((day: any) => [
        day.date || "N/A",
        (day.present || 0).toString(),
        (day.absent || 0).toString(),
        (day.late || 0).toString(),
        (day.halfDay || 0).toString(),
        (day.onLeave || 0).toString(),
        (
          (day.present || 0) +
          (day.absent || 0) +
          (day.late || 0) +
          (day.halfDay || 0) +
          (day.onLeave || 0)
        ).toString(),
      ]);

    autoTable(this.pdf, {
      startY: this.yPos,
      head: [
        ["Date", "Present", "Absent", "Late", "Half Day", "On Leave", "Total"],
      ],
      body: tableData,
      margin: { left: this.margin, right: this.margin },
      theme: "grid",
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    this.yPos = (this.pdf as any).lastAutoTable.finalY + 8;
  }

  // Employee Distribution Table
  addEmployeeDistributionSection(distData: any[]) {
    this.addSectionDivider("Employee Distribution");

    if (!distData || distData.length === 0) {
      this.pdf.setFontSize(10);
      this.pdf.setTextColor(148, 163, 184);
      this.pdf.text("No employee data available", this.margin, this.yPos);
      this.yPos += 10;
      return;
    }

    const tableData = distData.map((dept: any) => [
      dept.department || "Unknown",
      (dept.fullTime || 0).toString(),
      (dept.contract || 0).toString(),
      (dept.remote || 0).toString(),
      (dept.total || 0).toString(),
    ]);

    autoTable(this.pdf, {
      startY: this.yPos,
      head: [["Department", "Full-Time", "Contract", "Remote", "Total"]],
      body: tableData,
      margin: { left: this.margin, right: this.margin },
      theme: "grid",
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 10,
      },
      bodyStyles: { fontSize: 10 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    this.yPos = (this.pdf as any).lastAutoTable.finalY + 8;
  }

  // Leave Trends Table
  addLeaveTrendsSection(
    leaveData: any[],
    leaveTypeKeys: string[],
    leaveTypeLabels: Record<string, string>,
  ) {
    this.addSectionDivider("Leave Trends");

    if (!leaveData || leaveData.length === 0) {
      this.pdf.setFontSize(10);
      this.pdf.setTextColor(148, 163, 184);
      this.pdf.text("No leave data available", this.margin, this.yPos);
      this.yPos += 10;
      return;
    }

    const headers = [
      "Team",
      ...leaveTypeKeys.map((k) => leaveTypeLabels[k] || k),
      "Total",
    ];
    const tableData = leaveData.map((team: any) => {
      const row = [team.team || "Unknown"];
      leaveTypeKeys.forEach((k) => row.push((team[k] || 0).toString()));
      row.push((team.total || 0).toString());
      return row;
    });

    autoTable(this.pdf, {
      startY: this.yPos,
      head: [headers],
      body: tableData,
      margin: { left: this.margin, right: this.margin },
      theme: "grid",
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    this.yPos = (this.pdf as any).lastAutoTable.finalY + 8;
  }

  // Add page footer
  addFooters() {
    const totalPages = this.pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.pdf.setPage(i);

      // Footer line
      this.pdf.setDrawColor(226, 232, 240);
      this.pdf.setLineWidth(0.3);
      this.pdf.line(
        this.margin,
        this.pageHeight - 15,
        this.pageWidth - this.margin,
        this.pageHeight - 15,
      );

      // Footer text
      this.pdf.setFontSize(8);
      this.pdf.setTextColor(148, 163, 184);
      this.pdf.text(
        `Generated: ${new Date().toLocaleDateString()} | Page ${i} of ${totalPages}`,
        this.margin,
        this.pageHeight - 10,
      );
      this.pdf.text(
        "Taskflow Analytics Report",
        this.pageWidth - this.margin,
        this.pageHeight - 10,
        { align: "right" },
      );
    }
  }

  // Save PDF
  save(filename?: string) {
    this.addFooters();
    const date = new Date().toISOString().split("T")[0];
    this.pdf.save(filename || `analytics-report-${date}.pdf`);
  }
}

export default ExportPdfService;
